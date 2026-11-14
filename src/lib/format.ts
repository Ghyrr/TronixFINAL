import type { Lang } from '@/lib/types';

const LOCALE_BY_LANG: Record<Lang, string> = {
  en: 'en-US',
  ar: 'ar-EG',
};

export function localized<T extends object>(item: T, field: string, lang: Lang): string {
  const arabic = (item as Record<string, unknown>)[`${field}_ar`];
  const english = (item as Record<string, unknown>)[`${field}_en`];
  if (lang === 'ar') return (typeof arabic === 'string' && arabic) || (typeof english === 'string' ? english : '');
  return (typeof english === 'string' && english) || (typeof arabic === 'string' ? arabic : '');
}

export function formatMoney(amount: number, currencyCode: string, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE_BY_LANG[lang], {
    style: 'currency',
    currency: currencyCode || 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE_BY_LANG[lang], { maximumFractionDigits: 2 }).format(value);
}

export function formatDate(value: string, lang: Lang, withTime = false): string {
  return new Intl.DateTimeFormat(LOCALE_BY_LANG[lang], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value));
}

export function discountPercent(price: number, salePrice: number | null): number {
  if (!salePrice || salePrice >= price || price <= 0) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

export function effectivePrice(price: number, salePrice: number | null): number {
  return salePrice !== null && salePrice < price ? salePrice : price;
}

export function stockState(quantity: number, threshold: number, available: boolean): 'out' | 'low' | 'in' | 'unavailable' {
  if (!available) return 'unavailable';
  if (quantity <= 0) return 'out';
  if (quantity <= threshold) return 'low';
  return 'in';
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
