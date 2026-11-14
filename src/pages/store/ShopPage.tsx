import { useCallback, useEffect, useState } from 'react';
import { fetchProducts, type ProductSort } from '@/api/catalog';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { Link, useSearchParams } from '@/lib/router';
import { localized } from '@/lib/format';
import { ProductGrid } from '@/components/store/ProductGrid';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { EmptyState } from '@/components/ui/PageState';
import { SelectInput } from '@/components/ui/FormFields';
import type { Product } from '@/lib/types';

const SORTS: ProductSort[] = ['newest', 'price_asc', 'price_desc', 'name'];
const SORT_KEYS = {
  newest: 'shop.sort.newest',
  price_asc: 'shop.sort.priceAsc',
  price_desc: 'shop.sort.priceDesc',
  name: 'shop.sort.name',
} as const;

export function ShopPage({ categorySlug, brandSlug }: { categorySlug?: string; brandSlug?: string }) {
  const { t, lang } = useLanguage();
  const { categories, brands } = useSettings();
  const [params, setParams] = useSearchParams();

  const category = categorySlug ? categories.find((item) => item.slug === categorySlug) ?? null : null;
  const brand = brandSlug ? brands.find((item) => item.slug === brandSlug) ?? null : null;
  const invalidScope = (categorySlug && !category) || (brandSlug && !brand);

  const q = params.get('q') ?? '';
  const sortParam = params.get('sort');
  const sort: ProductSort = SORTS.includes(sortParam as ProductSort) ? (sortParam as ProductSort) : 'newest';
  const inStock = params.get('stock') === '1';
  const onSale = params.get('sale') === '1';

  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const pageTitle = category
    ? localized(category, 'name', lang)
    : brand
      ? brand.name
      : t('shop.title');

  useDocumentMeta({
    title: `${pageTitle} | TRONIX`,
    description: t('shop.allProducts'),
  });

  useEffect(() => {
    if (invalidScope) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchProducts({
      categoryId: category?.id,
      brandId: brand?.id,
      search: q,
      sort,
      inStockOnly: inStock,
      onSaleOnly: onSale,
      limit: 96,
    })
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category?.id, brand?.id, q, sort, inStock, onSale, invalidScope, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  if (invalidScope) {
    return <EmptyState message={t('notfound.body')} action={<Link to="/shop" className="btn-primary">{t('product.backToShop')}</Link>} />;
  }

  const toggle = (key: string) => (checked: boolean) => setParams({ [key]: checked ? '1' : null });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="breadcrumb" className="mb-4 text-sm text-steel-500">
        <Link to="/" className="hover:text-brand-600">{t('nav.home')}</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-brand-600">{t('shop.title')}</Link>
        {pageTitle !== t('shop.title') && <><span className="mx-2">/</span><span className="text-steel-800">{pageTitle}</span></>}
      </nav>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-steel-900">{q ? t('search.results', { query: q }) : pageTitle}</h1>
          {products && <p className="mt-1 text-sm text-steel-500">{t('shop.count', { count: products.length })}</p>}
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <label className="flex items-center gap-2 text-sm text-steel-700">
            <input type="checkbox" checked={inStock} onChange={(e) => toggle('stock')(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            {t('shop.inStock')}
          </label>
          <label className="flex items-center gap-2 text-sm text-steel-700">
            <input type="checkbox" checked={onSale} onChange={(e) => toggle('sale')(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            {t('shop.onSale')}
          </label>
          <div className="w-full sm:w-56">
            <SelectInput aria-label={t('shop.sort')} value={sort} onChange={(e) => setParams({ sort: e.target.value === 'newest' ? null : e.target.value })}>
              {SORTS.map((value) => (
                <option key={value} value={value}>{t(SORT_KEYS[value])}</option>
              ))}
            </SelectInput>
          </div>
        </div>
      </header>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Link to="/shop" className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${!categorySlug && !brandSlug ? 'border-brand-600 bg-brand-600 text-white' : 'border-steel-300 bg-white text-steel-700 hover:border-brand-300'}`}>
          {t('shop.allProducts')}
        </Link>
        {categories.map((item) => (
          <Link
            key={item.id}
            to={`/category/${item.slug}`}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${categorySlug === item.slug ? 'border-brand-600 bg-brand-600 text-white' : 'border-steel-300 bg-white text-steel-700 hover:border-brand-300'}`}
          >
            {localized(item, 'name', lang)}
          </Link>
        ))}
      </div>

      {brands.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <span className="self-center text-sm font-semibold text-steel-600">{t('shop.brands')}:</span>
          {brands.map((item) => (
            <Link
              key={item.id}
              to={`/brand/${item.slug}`}
              className={`rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${brandSlug === item.slug ? 'border-brand-600 text-brand-700' : 'border-steel-200 text-steel-600 hover:border-brand-300'}`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}

      <ProductGrid
        products={products}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyMessage={q ? t('search.empty') : t('shop.empty')}
      />
    </div>
  );
}
