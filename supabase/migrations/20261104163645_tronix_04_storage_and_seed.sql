/*
# TRONIX image storage, starter categories, brands and settings

1. Plain-English summary
- Creates a public image library ("store-media") for product photos, banners and the logo/favicon. Anyone can view the images; only admins with catalog or settings permission can upload, replace or delete them.
- Adds the 13 starter laptop-part categories in English and Arabic, a set of common laptop brands, and the default store settings (general information and homepage sections).

2. New data
- Storage bucket `store-media`.
- Categories: 13 bilingual categories.
- Brands: Dell, HP, Lenovo, ASUS, Acer, Apple, MSI, Toshiba.
- Site settings: `general` and `homepage`.

3. Security changes
- Storage: public read on `store-media`; insert, update and delete restricted to admins with catalog or settings permission.

4. Important notes
- Seed inserts skip rows that already exist, so re-running this migration never duplicates data or overwrites edits made in the dashboard.
- Default delivery fee and free-delivery threshold can be changed in Website Settings.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('store-media', 'store-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "store_media_public_read" ON storage.objects;
CREATE POLICY "store_media_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'store-media');

DROP POLICY IF EXISTS "store_media_admin_insert" ON storage.objects;
CREATE POLICY "store_media_admin_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'store-media' AND (has_permission('products') OR has_permission('settings')));

DROP POLICY IF EXISTS "store_media_admin_update" ON storage.objects;
CREATE POLICY "store_media_admin_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'store-media' AND (has_permission('products') OR has_permission('settings')))
  WITH CHECK (bucket_id = 'store-media' AND (has_permission('products') OR has_permission('settings')));

DROP POLICY IF EXISTS "store_media_admin_delete" ON storage.objects;
CREATE POLICY "store_media_admin_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'store-media' AND (has_permission('products') OR has_permission('settings')));

INSERT INTO categories (slug, name_en, name_ar, sort_order) VALUES
  ('laptop-batteries', 'Laptop Batteries', 'بطاريات اللابتوب', 1),
  ('laptop-chargers', 'Laptop Chargers', 'شواحن اللابتوب', 2),
  ('cooling-fans', 'Cooling Fans', 'مراوح التبريد', 3),
  ('keyboards', 'Keyboards', 'لوحات المفاتيح', 4),
  ('screens-displays', 'Screens & Displays', 'الشاشات والعروض', 5),
  ('hinges', 'Hinges', 'المفصلات', 6),
  ('dc-jacks', 'DC Jacks', 'منافذ التغذية DC', 7),
  ('cables-connectors', 'Cables & Connectors', 'الكابلات والموصلات', 8),
  ('speakers', 'Speakers', 'السماعات', 9),
  ('touchpads', 'Touchpads', 'لوحات اللمس', 10),
  ('motherboards', 'Motherboards', 'اللوحات الأم', 11),
  ('ram-ssd', 'RAM & SSD', 'الذاكرة ووحدات التخزين SSD', 12),
  ('laptop-accessories', 'Laptop Accessories', 'إكسسوارات اللابتوب', 13)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO brands (slug, name, sort_order) VALUES
  ('dell', 'Dell', 1),
  ('hp', 'HP', 2),
  ('lenovo', 'Lenovo', 3),
  ('asus', 'ASUS', 4),
  ('acer', 'Acer', 5),
  ('apple', 'Apple', 6),
  ('msi', 'MSI', 7),
  ('toshiba', 'Toshiba', 8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO site_settings (key, value) VALUES
  ('general', '{
    "store_name": "TRONIX",
    "logo_url": "",
    "favicon_url": "",
    "phone": "",
    "whatsapp_number": "",
    "email": "",
    "address_en": "",
    "address_ar": "",
    "social": {"facebook": "", "instagram": "", "tiktok": "", "x": ""},
    "currency_code": "USD",
    "delivery_fee": 5,
    "free_delivery_threshold": 100,
    "announcement_enabled": true,
    "announcement_en": "Cash on delivery available nationwide",
    "announcement_ar": "الدفع عند الاستلام متاح في جميع أنحاء البلاد"
  }'::jsonb),
  ('homepage', '{
    "show_hero": true,
    "show_categories": true,
    "show_featured": true,
    "show_best_sellers": true,
    "show_latest": true
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
