export type Lang = 'ar' | 'en';

export type AdminRole = 'super_admin' | 'admin';

export type PermissionKey = 'products' | 'orders' | 'customers' | 'inventory' | 'settings';

export type AdminPermissions = Record<PermissionKey, boolean>;

export interface Admin {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  permissions: AdminPermissions;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  sort_order: number;
  is_active: boolean;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface SpecEntry {
  label_en: string;
  label_ar: string;
  value_en: string;
  value_ar: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  category_id: string;
  brand_id: string | null;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_visible: boolean;
  compatible_models: string[];
  specifications: SpecEntry[];
  created_at: string;
  updated_at: string;
  category: Pick<Category, 'id' | 'slug' | 'name_en' | 'name_ar'> | null;
  brand: Pick<Brand, 'id' | 'slug' | 'name'> | null;
  product_images: ProductImage[];
}

export interface StockMovement {
  id: string;
  product_id: string;
  change_qty: number;
  resulting_qty: number;
  reason: 'restock' | 'adjustment' | 'correction' | 'order' | 'order_cancelled';
  note: string;
  admin_id: string | null;
  order_id: string | null;
  created_at: string;
}

export interface Banner {
  id: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface GeneralSettings {
  store_name: string;
  logo_url: string;
  favicon_url: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  address_en: string;
  address_ar: string;
  social: { facebook: string; instagram: string; tiktok: string; x: string };
  currency_code: string;
  delivery_fee: number;
  free_delivery_threshold: number;
  announcement_enabled: boolean;
  announcement_en: string;
  announcement_ar: string;
  announcement_speed: 'slow' | 'normal' | 'fast';
}

export interface Governorate {
  id: string;
  name_en: string;
  name_ar: string;
  delivery_fee: number;
  is_active: boolean;
  sort_order: number;
}

export interface HomepageSettings {
  show_hero: boolean;
  show_categories: boolean;
  show_featured: boolean;
  show_best_sellers: boolean;
  show_latest: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_method: 'cod' | 'whatsapp';
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  city: string;
  address: string;
  notes: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  sku: string;
  name_en: string;
  name_ar: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  city: string;
  address: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
