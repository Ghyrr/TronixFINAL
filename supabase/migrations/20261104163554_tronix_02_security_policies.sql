/*
# TRONIX security: permission helpers, row level security and grants

1. Plain-English summary
Locks every table down and defines who can read or change what. Shoppers (anonymous visitors) can only read visible products, active categories and brands, active banners and public settings. Signed-in admins can only do what their role and permissions allow. Customer and order data is never readable by shoppers.

2. Helper checks
- `is_active_admin()`: true when the signed-in account is an active admin.
- `is_super_admin()`: true when the signed-in account is an active super admin.
- `has_permission(perm)`: true for super admins, or active admins whose permission flag for `perm` (products, orders, customers, inventory, settings) is set.

3. Security changes
- Row level security enabled on every TRONIX table.
- Four separate policies per table where writes are allowed.
- Admins table: an admin can read their own row; super admins can read all rows. Writes happen only through the server-side admin function.
- Orders, order lines, customers and stock history: admins only, via permission checks.
- Column-level update grant on products so stock is changed only through the stock adjustment function.

4. Important notes
- Helper checks run with elevated rights but only read data about the caller.
- Shoppers place orders through a dedicated function (next migration), never by writing to orders directly.
*/

CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins a WHERE a.id = auth.uid() AND a.is_active
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins a WHERE a.id = auth.uid() AND a.is_active AND a.role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(perm text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins a
    WHERE a.id = auth.uid()
      AND a.is_active
      AND (a.role = 'super_admin' OR a.permissions->>perm = 'true')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_active_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_permission(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(text) TO anon, authenticated;

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- admins
GRANT SELECT ON admins TO authenticated;
DROP POLICY IF EXISTS "admins_select_self_or_super" ON admins;
CREATE POLICY "admins_select_self_or_super" ON admins FOR SELECT
  TO authenticated USING (id = auth.uid() OR is_super_admin());

-- categories and brands: shoppers see active rows; admins with catalog or settings access see all
GRANT SELECT ON categories, brands TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON categories, brands TO authenticated;

DROP POLICY IF EXISTS "categories_select" ON categories;
CREATE POLICY "categories_select" ON categories FOR SELECT
  TO anon, authenticated USING (is_active OR has_permission('products') OR has_permission('settings'));
DROP POLICY IF EXISTS "categories_insert" ON categories;
CREATE POLICY "categories_insert" ON categories FOR INSERT
  TO authenticated WITH CHECK (has_permission('settings'));
DROP POLICY IF EXISTS "categories_update" ON categories;
CREATE POLICY "categories_update" ON categories FOR UPDATE
  TO authenticated USING (has_permission('settings')) WITH CHECK (has_permission('settings'));
DROP POLICY IF EXISTS "categories_delete" ON categories;
CREATE POLICY "categories_delete" ON categories FOR DELETE
  TO authenticated USING (has_permission('settings'));

DROP POLICY IF EXISTS "brands_select" ON brands;
CREATE POLICY "brands_select" ON brands FOR SELECT
  TO anon, authenticated USING (is_active OR has_permission('products') OR has_permission('settings'));
DROP POLICY IF EXISTS "brands_insert" ON brands;
CREATE POLICY "brands_insert" ON brands FOR INSERT
  TO authenticated WITH CHECK (has_permission('settings'));
DROP POLICY IF EXISTS "brands_update" ON brands;
CREATE POLICY "brands_update" ON brands FOR UPDATE
  TO authenticated USING (has_permission('settings')) WITH CHECK (has_permission('settings'));
DROP POLICY IF EXISTS "brands_delete" ON brands;
CREATE POLICY "brands_delete" ON brands FOR DELETE
  TO authenticated USING (has_permission('settings'));

-- products: shoppers see visible products; admins with catalog or inventory access see all
GRANT SELECT ON products TO anon, authenticated;
GRANT INSERT, DELETE ON products TO authenticated;
GRANT UPDATE (sku, slug, name_en, name_ar, description_en, description_ar, category_id, brand_id,
  price, sale_price, low_stock_threshold, is_available, is_featured, is_best_seller, is_visible,
  compatible_models, specifications, updated_at) ON products TO authenticated;

DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select" ON products FOR SELECT
  TO anon, authenticated USING (is_visible OR has_permission('products') OR has_permission('inventory'));
DROP POLICY IF EXISTS "products_insert" ON products;
CREATE POLICY "products_insert" ON products FOR INSERT
  TO authenticated WITH CHECK (has_permission('products'));
DROP POLICY IF EXISTS "products_update" ON products;
CREATE POLICY "products_update" ON products FOR UPDATE
  TO authenticated USING (has_permission('products')) WITH CHECK (has_permission('products'));
DROP POLICY IF EXISTS "products_delete" ON products;
CREATE POLICY "products_delete" ON products FOR DELETE
  TO authenticated USING (has_permission('products'));

-- product images
GRANT SELECT ON product_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON product_images TO authenticated;

DROP POLICY IF EXISTS "product_images_select" ON product_images;
CREATE POLICY "product_images_select" ON product_images FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_images.product_id AND p.is_visible)
    OR has_permission('products') OR has_permission('inventory')
  );
DROP POLICY IF EXISTS "product_images_insert" ON product_images;
CREATE POLICY "product_images_insert" ON product_images FOR INSERT
  TO authenticated WITH CHECK (has_permission('products'));
DROP POLICY IF EXISTS "product_images_update" ON product_images;
CREATE POLICY "product_images_update" ON product_images FOR UPDATE
  TO authenticated USING (has_permission('products')) WITH CHECK (has_permission('products'));
DROP POLICY IF EXISTS "product_images_delete" ON product_images;
CREATE POLICY "product_images_delete" ON product_images FOR DELETE
  TO authenticated USING (has_permission('products'));

-- banners: shoppers see active banners
GRANT SELECT ON banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON banners TO authenticated;

DROP POLICY IF EXISTS "banners_select" ON banners;
CREATE POLICY "banners_select" ON banners FOR SELECT
  TO anon, authenticated USING (is_active OR has_permission('settings'));
DROP POLICY IF EXISTS "banners_insert" ON banners;
CREATE POLICY "banners_insert" ON banners FOR INSERT
  TO authenticated WITH CHECK (has_permission('settings'));
DROP POLICY IF EXISTS "banners_update" ON banners;
CREATE POLICY "banners_update" ON banners FOR UPDATE
  TO authenticated USING (has_permission('settings')) WITH CHECK (has_permission('settings'));
DROP POLICY IF EXISTS "banners_delete" ON banners;
CREATE POLICY "banners_delete" ON banners FOR DELETE
  TO authenticated USING (has_permission('settings'));

-- site settings: public read, settings admins write
GRANT SELECT ON site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON site_settings TO authenticated;

DROP POLICY IF EXISTS "site_settings_select" ON site_settings;
CREATE POLICY "site_settings_select" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "site_settings_insert" ON site_settings;
CREATE POLICY "site_settings_insert" ON site_settings FOR INSERT
  TO authenticated WITH CHECK (has_permission('settings'));
DROP POLICY IF EXISTS "site_settings_update" ON site_settings;
CREATE POLICY "site_settings_update" ON site_settings FOR UPDATE
  TO authenticated USING (has_permission('settings')) WITH CHECK (has_permission('settings'));

-- customers, orders and order lines: admins only (shoppers use place_order)
GRANT SELECT ON customers, orders, order_items TO authenticated;

DROP POLICY IF EXISTS "customers_select" ON customers;
CREATE POLICY "customers_select" ON customers FOR SELECT
  TO authenticated USING (has_permission('customers') OR has_permission('orders'));

DROP POLICY IF EXISTS "orders_select" ON orders;
CREATE POLICY "orders_select" ON orders FOR SELECT
  TO authenticated USING (has_permission('orders'));

DROP POLICY IF EXISTS "order_items_select" ON order_items;
CREATE POLICY "order_items_select" ON order_items FOR SELECT
  TO authenticated USING (has_permission('orders'));

-- stock history: read by inventory admins; written only by adjust_stock
GRANT SELECT ON product_stock_movements TO authenticated;

DROP POLICY IF EXISTS "stock_movements_select" ON product_stock_movements;
CREATE POLICY "stock_movements_select" ON product_stock_movements FOR SELECT
  TO authenticated USING (has_permission('inventory'));

-- activity logs: active admins can record their own actions; super admins can read them
GRANT SELECT, INSERT ON activity_logs TO authenticated;

DROP POLICY IF EXISTS "activity_logs_select" ON activity_logs;
CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT
  TO authenticated USING (is_super_admin());
DROP POLICY IF EXISTS "activity_logs_insert" ON activity_logs;
CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (is_active_admin() AND admin_id = auth.uid());
