import type { GeneralSettings, HomepageSettings } from '@/lib/types';

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  store_name: 'TRONIX',
  logo_url: '',
  favicon_url: '',
  phone: '',
  whatsapp_number: '',
  email: '',
  address_en: '',
  address_ar: '',
  social: { facebook: '', instagram: '', tiktok: '', x: '' },
  currency_code: 'USD',
  delivery_fee: 0,
  free_delivery_threshold: 0,
  announcement_enabled: false,
  announcement_en: '',
  announcement_ar: '',
  announcement_speed: 'normal' as const,
};

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  show_hero: true,
  show_categories: true,
  show_featured: true,
  show_best_sellers: true,
  show_latest: true,
};
