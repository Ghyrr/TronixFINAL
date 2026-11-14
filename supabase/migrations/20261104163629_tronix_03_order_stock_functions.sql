/*
# TRONIX order placement, stock adjustments and order status functions

1. Plain-English summary
Adds three secure database functions that the website and dashboard use for every money- or stock-changing action:
- `place_order`: used by shoppers at checkout. It re-checks every product price and stock level on the server, so a shopper can never change prices from the browser. It creates the customer record, the order and its lines, reduces stock and records the stock movement, all in one all-or-nothing step.
- `adjust_stock`: used by admins with inventory permission to add restocks or corrections. It refuses any change that would make stock negative and records who made the change.
- `set_order_status`: used by admins with order permission to move an order through its statuses. Cancelling an order returns its items to stock. Delivered and cancelled orders cannot be reopened.

2. New functions
- `place_order(jsonb)`: returns the order number, total and whether it was a duplicate.
- `adjust_stock(uuid, integer, text, text)`: returns the new stock quantity.
- `set_order_status(uuid, text)`: returns the resulting status.

3. Security changes
- Duplicate protection: each checkout carries a unique key. Submitting the same key again returns the original order instead of creating a second one.
- Shoppers can only call `place_order`. Admin functions require a signed-in admin with the matching permission.
- Functions that are not public are not callable by shoppers.

4. Important notes
- Delivery fee and free-delivery threshold come from the general site settings.
- Each function runs as a single transaction, so partial orders are never saved.
*/

CREATE OR REPLACE FUNCTION public.place_order(p jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text := left(trim(coalesce(p->>'idempotency_key', '')), 100);
  v_method text := coalesce(p->>'payment_method', 'cod');
  v_name text := left(trim(coalesce(p->>'full_name', '')), 120);
  v_phone text := left(trim(coalesce(p->>'phone', '')), 30);
  v_city text := left(trim(coalesce(p->>'city', '')), 80);
  v_address text := left(trim(coalesce(p->>'address', '')), 300);
  v_notes text := left(trim(coalesce(p->>'notes', '')), 500);
  v_existing orders%ROWTYPE;
  v_settings jsonb;
  v_delivery_fee numeric(12,2);
  v_threshold numeric(12,2);
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product products%ROWTYPE;
  v_qty integer;
  v_unit numeric(12,2);
  v_line numeric(12,2);
  v_stock integer;
  v_subtotal numeric(12,2) := 0;
  v_fee numeric(12,2) := 0;
BEGIN
  IF length(v_key) < 8 THEN RAISE EXCEPTION 'invalid_request'; END IF;
  IF v_method NOT IN ('cod', 'whatsapp') THEN RAISE EXCEPTION 'invalid_request'; END IF;
  IF length(v_name) < 2 OR length(v_city) < 2 OR length(v_address) < 5 THEN RAISE EXCEPTION 'invalid_customer'; END IF;
  IF v_phone !~ '^\+?[0-9 ()-]{6,30}$' THEN RAISE EXCEPTION 'invalid_customer'; END IF;
  IF jsonb_typeof(p->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(p->'items') NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'empty_cart';
  END IF;

  SELECT * INTO v_existing FROM orders WHERE idempotency_key = v_key;
  IF FOUND THEN
    RETURN jsonb_build_object('order_number', v_existing.order_number, 'total', v_existing.total, 'duplicate', true);
  END IF;

  SELECT value INTO v_settings FROM site_settings WHERE key = 'general';
  v_delivery_fee := coalesce((v_settings->>'delivery_fee')::numeric, 0);
  v_threshold := coalesce((v_settings->>'free_delivery_threshold')::numeric, 0);

  INSERT INTO customers (full_name, phone, city, address)
  VALUES (v_name, v_phone, v_city, v_address)
  ON CONFLICT (phone) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_customer_id;

  v_order_number := 'TRX-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));

  INSERT INTO orders (order_number, idempotency_key, customer_id, payment_method, customer_name, customer_phone, city, address, notes)
  VALUES (v_order_number, v_key, v_customer_id, v_method, v_name, v_phone, v_city, v_address, v_notes)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p->'items') LOOP
    v_qty := coalesce((v_item->>'quantity')::integer, 0);
    IF v_qty < 1 OR v_qty > 99 THEN RAISE EXCEPTION 'invalid_quantity'; END IF;

    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::uuid FOR UPDATE;
    IF NOT FOUND OR NOT v_product.is_visible OR NOT v_product.is_available THEN
      RAISE EXCEPTION 'product_unavailable';
    END IF;
    IF v_product.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'insufficient_stock:%', v_product.sku;
    END IF;

    v_unit := coalesce(v_product.sale_price, v_product.price);
    v_line := v_unit * v_qty;
    v_subtotal := v_subtotal + v_line;

    INSERT INTO order_items (order_id, product_id, sku, name_en, name_ar, unit_price, quantity, line_total)
    VALUES (v_order_id, v_product.id, v_product.sku, v_product.name_en, v_product.name_ar, v_unit, v_qty, v_line);

    UPDATE products SET stock_quantity = stock_quantity - v_qty, updated_at = now()
    WHERE id = v_product.id
    RETURNING stock_quantity INTO v_stock;

    INSERT INTO product_stock_movements (product_id, change_qty, resulting_qty, reason, order_id, note)
    VALUES (v_product.id, -v_qty, v_stock, 'order', v_order_id, v_order_number);
  END LOOP;

  v_fee := CASE WHEN v_threshold > 0 AND v_subtotal >= v_threshold THEN 0 ELSE v_delivery_fee END;

  UPDATE orders
  SET subtotal = v_subtotal, delivery_fee = v_fee, total = v_subtotal + v_fee
  WHERE id = v_order_id;

  RETURN jsonb_build_object('order_number', v_order_number, 'total', v_subtotal + v_fee, 'duplicate', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_stock(p_product_id uuid, p_change integer, p_reason text, p_note text DEFAULT '')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new integer;
  v_sku text;
BEGIN
  IF NOT has_permission('inventory') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_change IS NULL OR p_change = 0 OR abs(p_change) > 100000 THEN RAISE EXCEPTION 'invalid_quantity'; END IF;
  IF p_reason NOT IN ('restock', 'adjustment', 'correction') THEN RAISE EXCEPTION 'invalid_reason'; END IF;

  UPDATE products
  SET stock_quantity = stock_quantity + p_change, updated_at = now()
  WHERE id = p_product_id AND stock_quantity + p_change >= 0
  RETURNING stock_quantity, sku INTO v_new, v_sku;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM products WHERE id = p_product_id) THEN
      RAISE EXCEPTION 'negative_stock';
    END IF;
    RAISE EXCEPTION 'not_found';
  END IF;

  INSERT INTO product_stock_movements (product_id, change_qty, resulting_qty, reason, note, admin_id)
  VALUES (p_product_id, p_change, v_new, p_reason, left(coalesce(p_note, ''), 300), auth.uid());

  INSERT INTO activity_logs (action, entity, entity_id, details)
  VALUES ('stock_adjusted', 'product', p_product_id::text,
    jsonb_build_object('sku', v_sku, 'change', p_change, 'reason', p_reason, 'resulting', v_new));

  RETURN v_new;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_order_status(p_order_id uuid, p_status text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old text;
  v_order_number text;
  v_stock integer;
  r record;
BEGIN
  IF NOT has_permission('orders') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_status NOT IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  SELECT status, order_number INTO v_old, v_order_number FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF v_old = p_status THEN RETURN v_old; END IF;
  IF v_old IN ('delivered', 'cancelled') THEN RAISE EXCEPTION 'order_closed'; END IF;

  IF p_status = 'cancelled' THEN
    FOR r IN SELECT product_id, quantity FROM order_items WHERE order_id = p_order_id AND product_id IS NOT NULL LOOP
      UPDATE products SET stock_quantity = stock_quantity + r.quantity, updated_at = now()
      WHERE id = r.product_id
      RETURNING stock_quantity INTO v_stock;

      INSERT INTO product_stock_movements (product_id, change_qty, resulting_qty, reason, order_id, admin_id, note)
      VALUES (r.product_id, r.quantity, v_stock, 'order_cancelled', p_order_id, auth.uid(), v_order_number);
    END LOOP;
  END IF;

  UPDATE orders SET status = p_status, updated_at = now() WHERE id = p_order_id;

  INSERT INTO activity_logs (action, entity, entity_id, details)
  VALUES ('order_status_changed', 'order', p_order_id::text,
    jsonb_build_object('order_number', v_order_number, 'from', v_old, 'to', p_status));

  RETURN p_status;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.place_order(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_order_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_order_status(uuid, text) TO authenticated;
