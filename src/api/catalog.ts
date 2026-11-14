import { supabase } from '@/lib/supabase';
import { DEFAULT_GENERAL_SETTINGS, DEFAULT_HOMEPAGE_SETTINGS } from '@/lib/settingsDefaults';
import type { Banner, Brand, Category, GeneralSettings, Governorate, HomepageSettings, Product } from '@/lib/types';

export const PRODUCT_SELECT =
  '*, category:categories(id, slug, name_en, name_ar), brand:brands(id, slug, name), product_images(id, product_id, url, sort_order)';

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name';

export interface ProductQuery {
  categoryId?: string;
  brandId?: string;
  search?: string;
  featuredOnly?: boolean;
  bestSellersOnly?: boolean;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sort?: ProductSort;
  limit?: number;
}

export function sanitizeSearch(value: string): string {
  return value.replace(/[%_,()*\\]/g, ' ').trim().slice(0, 80);
}

export async function fetchStoreSettings(): Promise<{ general: GeneralSettings; homepage: HomepageSettings }> {
  const { data, error } = await supabase.from('site_settings').select('key, value').in('key', ['general', 'homepage']);
  if (error) throw error;

  const rows = new Map((data ?? []).map((row) => [row.key as string, row.value as Record<string, unknown>]));
  const general = (rows.get('general') ?? {}) as Partial<GeneralSettings>;
  const homepage = (rows.get('homepage') ?? {}) as Partial<HomepageSettings>;

  return {
    general: {
      ...DEFAULT_GENERAL_SETTINGS,
      ...general,
      social: { ...DEFAULT_GENERAL_SETTINGS.social, ...general.social },
    },
    homepage: { ...DEFAULT_HOMEPAGE_SETTINGS, ...homepage },
  };
}

export async function fetchActiveCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchActiveBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Brand[];
}

export async function fetchActiveBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Banner[];
}

export async function fetchProducts(query: ProductQuery = {}): Promise<Product[]> {
  let request = supabase.from('products').select(PRODUCT_SELECT).eq('is_visible', true);

  if (query.categoryId) request = request.eq('category_id', query.categoryId);
  if (query.brandId) request = request.eq('brand_id', query.brandId);
  if (query.featuredOnly) request = request.eq('is_featured', true);
  if (query.bestSellersOnly) request = request.eq('is_best_seller', true);
  if (query.inStockOnly) request = request.gt('stock_quantity', 0);
  if (query.onSaleOnly) request = request.not('sale_price', 'is', null);

  const search = query.search ? sanitizeSearch(query.search) : '';
  if (search) {
    request = request.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  switch (query.sort) {
    case 'price_asc':
      request = request.order('price', { ascending: true });
      break;
    case 'price_desc':
      request = request.order('price', { ascending: false });
      break;
    case 'name':
      request = request.order('name_en', { ascending: true });
      break;
    default:
      request = request.order('created_at', { ascending: false });
  }

  const { data, error } = await request.limit(query.limit ?? 96);
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchActiveGovernorates(): Promise<Governorate[]> {
  const { data, error } = await supabase
    .from('governorates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Governorate[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('is_visible', true)
    .maybeSingle();
  if (error) throw error;
  return (data as Product | null) ?? null;
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).in('id', ids);
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
  if (error) throw error;
  return (data as Category | null) ?? null;
}

export async function fetchBrandBySlug(slug: string): Promise<Brand | null> {
  const { data, error } = await supabase.from('brands').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
  if (error) throw error;
  return (data as Brand | null) ?? null;
}
