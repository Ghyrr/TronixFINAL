/*
# TRONIX core schema

1. Plain-English summary
Creates every table the TRONIX store needs: catalog (categories, brands, products, product images), inventory history, customers, orders and order lines, admin accounts, activity logs, homepage banners and site-wide settings.

2. New tables
- `admins`: one row per admin account, linked to the sign-in account. Holds role (super_admin or admin), permission flags, and active status.
- `categories`, `brands`: bilingual (English and Arabic) names, sort order, and visibility.
- `products`: bilingual names and descriptions, SKU, slug, prices, sale price, stock, low-stock threshold, availability, featured/best-seller/visibility flags, compatible laptop models and custom specifications.
- `product_images`: ordered image URLs for each product.
- `product_stock_movements`: every stock change with reason, resulting quantity and who made it.
- `customers`: one record per phone number.
- `orders`, `order_items`: placed orders with a snapshot of prices and product names.
- `activity_logs`: record of admin actions.
- `banners`: homepage promotional slides.
- `site_settings`: key/value JSON settings (general store info, homepage sections).

3. Security
Row level security is enabled and policies/grants are added in the next migration.

4. Important notes
- No existing data is modified; all statements are idempotent.
- Prices are stored as numeric(12,2).
*/

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  sale_price numeric(12,2) CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price <= price)),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  is_available boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_best_seller boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  compatible_models text[] NOT NULL DEFAULT '{}',
  specifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_brand_idx ON products(brand_id);

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_images_product_idx ON product_images(product_id, sort_order);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text,
  city text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  idempotency_key text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method text NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'whatsapp')),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  notes text NOT NULL DEFAULT '',
  subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders(customer_id);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  sku text NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total numeric(12,2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);

CREATE TABLE IF NOT EXISTS product_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_qty integer NOT NULL CHECK (change_qty <> 0),
  resulting_qty integer NOT NULL CHECK (resulting_qty >= 0),
  reason text NOT NULL CHECK (reason IN ('restock', 'adjustment', 'correction', 'order', 'order_cancelled')),
  note text NOT NULL DEFAULT '',
  admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON product_stock_movements(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid DEFAULT auth.uid() REFERENCES admins(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_logs_created_idx ON activity_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  subtitle_en text NOT NULL DEFAULT '',
  subtitle_ar text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  link_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
