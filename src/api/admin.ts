import { supabase } from '@/lib/supabase';
import { PRODUCT_SELECT } from '@/api/catalog';
import type {
  ActivityLog,
  Admin,
  AdminPermissions,
  Banner,
  Brand,
  Category,
  Customer,
  GeneralSettings,
  Governorate,
  HomepageSettings,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  SpecEntry,
  StockMovement,
} from '@/lib/types';

export interface ProductInput {
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
  low_stock_threshold: number;
  is_available: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_visible: boolean;
  compatible_models: string[];
  specifications: SpecEntry[];
}

export interface ProductImageInput {
  id?: string;
  url: string;
}

export interface BannerInput {
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface TaxonomyInput {
  slug: string;
  name_en?: string;
  name_ar?: string;
  name?: string;
  sort_order: number;
  is_active: boolean;
}

export async function fetchAdminProfile(userId: string): Promise<Admin | null> {
  const { data, error } = await supabase.from('admins').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data as Admin | null) ?? null;
}

export async function fetchAdminsExist(): Promise<boolean> {
  const { data, error } = await supabase.rpc('admins_exist');
  if (error) throw error;
  return data === true;
}

export async function fetchAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchAllBrands(): Promise<Brand[]> {
  const { data, error } = await supabase.from('brands').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Brand[];
}

export async function fetchAllGovernorates(): Promise<Governorate[]> {
  const { data, error } = await supabase.from('governorates').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Governorate[];
}

export interface GovernorateInput {
  name_en: string;
  name_ar: string;
  delivery_fee: number;
  is_active: boolean;
  sort_order: number;
}

export async function saveGovernorate(input: GovernorateInput, id?: string): Promise<void> {
  if (id) {
    const { error } = await supabase.from('governorates').update(input).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('governorates').insert(input);
    if (error) throw error;
  }
}

export async function deleteGovernorate(id: string): Promise<void> {
  const { error } = await supabase.from('governorates').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchAllBanners(): Promise<Banner[]> {
  const { data, error } = await supabase.from('banners').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Banner[];
}

export async function fetchAdminProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchAdminProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Product | null) ?? null;
}

export async function saveProduct(input: ProductInput, imageUrls: ProductImageInput[], productId?: string): Promise<string> {
  let id = productId;
  if (productId) {
    const { error } = await supabase
      .from('products')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', productId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...input, stock_quantity: 0 })
      .select('id')
      .single();
    if (error) throw error;
    id = data.id as string;
  }

  if (!id) throw new Error('Product id missing');
  await syncProductImages(id, imageUrls);
  return id;
}

async function syncProductImages(productId: string, images: ProductImageInput[]): Promise<void> {
  const { data: existing, error: existingError } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId);
  if (existingError) throw existingError;

  const keptIds = new Set(images.filter((image) => image.id).map((image) => image.id as string));
  const removedIds = (existing ?? []).map((row) => row.id as string).filter((id) => !keptIds.has(id));

  if (removedIds.length > 0) {
    const { error } = await supabase.from('product_images').delete().in('id', removedIds);
    if (error) throw error;
  }

  for (const [index, image] of images.entries()) {
    if (image.id) {
      const { error } = await supabase.from('product_images').update({ sort_order: index }).eq('id', image.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('product_images')
        .insert({ product_id: productId, url: image.url, sort_order: index });
      if (error) throw error;
    }
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateProduct(source: Product): Promise<string> {
  const stamp = Date.now().toString(36);
  const input: ProductInput = {
    sku: `${source.sku}-COPY-${stamp}`.slice(0, 60),
    slug: `${source.slug}-copy-${stamp}`.slice(0, 90),
    name_en: `${source.name_en} (Copy)`,
    name_ar: `${source.name_ar} (نسخة)`,
    description_en: source.description_en,
    description_ar: source.description_ar,
    category_id: source.category_id,
    brand_id: source.brand_id,
    price: source.price,
    sale_price: source.sale_price,
    low_stock_threshold: source.low_stock_threshold,
    is_available: source.is_available,
    is_featured: false,
    is_best_seller: false,
    is_visible: false,
    compatible_models: source.compatible_models,
    specifications: source.specifications,
  };
  const images = [...source.product_images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => ({ url: image.url }));
  return saveProduct(input, images);
}

export async function adjustStock(productId: string, change: number, reason: string, note: string): Promise<number> {
  const { data, error } = await supabase.rpc('adjust_stock', {
    p_product_id: productId,
    p_change: change,
    p_reason: reason,
    p_note: note,
  });
  if (error) throw error;
  return Number(data);
}

export async function fetchStockMovements(productId: string): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('product_stock_movements')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as StockMovement[];
}

export async function fetchAdminOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
  if (error) throw error;
  return (data ?? []) as OrderItem[];
}

export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.rpc('set_order_status', { p_order_id: orderId, p_status: status });
  if (error) throw error;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as Customer[];
}

export async function fetchCustomerOrders(customerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function fetchSettingsRow(key: 'general' | 'homepage'): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return (data?.value as Record<string, unknown> | undefined) ?? null;
}

export async function saveSettings(key: 'general' | 'homepage', value: GeneralSettings | HomepageSettings): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}

export async function saveBanner(input: BannerInput, id?: string): Promise<void> {
  if (id) {
    const { error } = await supabase.from('banners').update(input).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('banners').insert(input);
    if (error) throw error;
  }
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw error;
}

export async function saveCategory(input: TaxonomyInput & { name_en: string; name_ar: string }, id?: string): Promise<void> {
  if (id) {
    const { error } = await supabase.from('categories').update(input).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('categories').insert(input);
    if (error) throw error;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function saveBrand(input: TaxonomyInput & { name: string }, id?: string): Promise<void> {
  if (id) {
    const { error } = await supabase.from('brands').update(input).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('brands').insert(input);
    if (error) throw error;
  }
}

export async function deleteBrand(id: string): Promise<void> {
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchAllAdmins(): Promise<Admin[]> {
  const { data, error } = await supabase.from('admins').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Admin[];
}

export async function fetchActivityLogs(): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as ActivityLog[];
}

export async function logActivity(action: string, entity: string, entityId: string | null, details: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('activity_logs').insert({ action, entity, entity_id: entityId, details });
  if (error) throw error;
}

export function emptyPermissions(): AdminPermissions {
  return { products: false, orders: false, customers: false, inventory: false, settings: false };
}
