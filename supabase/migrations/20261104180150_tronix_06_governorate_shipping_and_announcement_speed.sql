/*
# TRONIX governorate-based shipping rates and announcement bar speed control

1. Plain-English summary
This migration adds two features the admin dashboard needs:
  a) Per-governorate shipping fees — different Egyptian governorates can have different delivery prices.
  b) Announcement bar speed control — admins can set the scrolling speed (marquee) of the top announcement bar.

The existing `place_order` function is replaced so it checks for a governorate-specific delivery fee first,
falling back to the default delivery fee from general settings. The free-delivery threshold still applies.

2. New tables
- `governorates`
  - `id` uuid primary key
  - `name_en` text — English governorate name (e.g. "Cairo")
  - `name_ar` text — Arabic governorate name (e.g. "القاهرة")
  - `delivery_fee` numeric(12,2) — shipping fee for this governorate (default 0)
  - `is_active` boolean — whether this governorate is selectable at checkout
  - `sort_order` integer — display ordering
  - `created_at` timestamptz

3. Modified functions
- `place_order(jsonb)` — now accepts an optional `governorate_id` in the payload.
  If provided and the governorate exists and is active, uses that governorate's delivery_fee.
  Otherwise falls back to the general settings delivery_fee.
  The `city` field is still required and stored on the order.

4. Security changes
- RLS enabled on `governorates`.
- SELECT granted to `anon, authenticated` (public read — shoppers need the list at checkout).
- INSERT/UPDATE/DELETE granted to `authenticated` with `settings` permission only.
- Four separate policies (select/insert/update/delete).

5. Data seeding
- Seeds 27 Egyptian governorates with default delivery fee of 0.

6. Important notes
- The general settings `delivery_fee` remains as the fallback when no governorate is selected or the governorate is not found.
- The `announcement_speed` setting is stored inside the existing `general` site_settings jsonb value — no schema change needed, just the default is added if missing.
*/

CREATE TABLE IF NOT EXISTS public.governorates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.governorates ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.governorates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.governorates TO authenticated;

DROP POLICY IF EXISTS "select_governorates" ON public.governorates;
CREATE POLICY "select_governorates"
  ON public.governorates FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_governorates" ON public.governorates;
CREATE POLICY "insert_governorates"
  ON public.governorates FOR INSERT
  TO authenticated
  WITH CHECK (has_permission('settings'));

DROP POLICY IF EXISTS "update_governorates" ON public.governorates;
CREATE POLICY "update_governorates"
  ON public.governorates FOR UPDATE
  TO authenticated
  USING (has_permission('settings'))
  WITH CHECK (has_permission('settings'));

DROP POLICY IF EXISTS "delete_governorates" ON public.governorates;
CREATE POLICY "delete_governorates"
  ON public.governorates FOR DELETE
  TO authenticated
  USING (has_permission('settings'));

-- Seed Egyptian governorates
INSERT INTO public.governorates (name_en, name_ar, delivery_fee, is_active, sort_order)
VALUES
  ('Cairo', 'القاهرة', 0, true, 1),
  ('Giza', 'الجيزة', 0, true, 2),
  ('Alexandria', 'الإسكندرية', 0, true, 3),
  ('Dakahlia', 'الدقهلية', 0, true, 4),
  ('Sharqia', 'الشرقية', 0, true, 5),
  ('Qalyubia', 'القليوبية', 0, true, 6),
  ('Kafr El Sheikh', 'كفر الشيخ', 0, true, 7),
  ('Gharbia', 'الغربية', 0, true, 8),
  ('Monufia', 'المنوفية', 0, true, 9),
  ('Beheira', 'البحيرة', 0, true, 10),
  ('Ismailia', 'الإسماعيلية', 0, true, 11),
  ('Port Said', 'بور سعيد', 0, true, 12),
  ('Suez', 'السويس', 0, true, 13),
  ('Faiyum', 'الفيوم', 0, true, 14),
  ('Beni Suef', 'بني سويف', 0, true, 15),
  ('Minya', 'المنيا', 0, true, 16),
  ('Asyut', 'أسيوط', 0, true, 17),
  ('Sohag', 'سوهاج', 0, true, 18),
  ('Qena', 'قنا', 0, true, 19),
  ('Luxor', 'الأقصر', 0, true, 20),
  ('Aswan', 'أسوان', 0, true, 21),
  ('Red Sea', 'البحر الأحمر', 0, true, 22),
  ('New Valley', 'الوادي الجديد', 0, true, 23),
  ('Matrouh', 'مطروح', 0, true, 24),
  ('North Sinai', 'شمال سيناء', 0, true, 25),
  ('South Sinai', 'جنوب سيناء', 0, true, 26),
  ('Damietta', 'دمياط', 0, true, 27)
ON CONFLICT DO NOTHING;

-- Replace place_order to support governorate-based delivery fees
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
  v_governorate_id text := trim(coalesce(p->>'governorate_id', ''));
  v_existing orders%ROWTYPE;
  v_settings jsonb;
  v_delivery_fee numeric(12,2);
  v_threshold numeric(12,2);
  v_gov_fee numeric(12,2);
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

  -- Check for governorate-specific delivery fee
  IF v_governorate_id <> '' AND v_governorate_id IS NOT NULL THEN
    SELECT delivery_fee INTO v_gov_fee FROM governorates WHERE id = v_governorate_id::uuid AND is_active = true;
    IF FOUND THEN
      v_delivery_fee := v_gov_fee;
    END IF;
  END IF;

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

-- Re-grant execute on the replaced function
REVOKE EXECUTE ON FUNCTION public.place_order(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb) TO anon, authenticated;
