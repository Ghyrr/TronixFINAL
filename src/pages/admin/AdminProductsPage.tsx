import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { Link, useRouter } from '@/lib/router';
import { fetchAdminProducts, deleteProduct, duplicateProduct } from '@/api/admin';
import { formatMoney, localized, effectivePrice, stockState } from '@/lib/format';
import { Badge, ErrorState, LoadingState } from '@/components/ui/PageState';
import { useToast } from '@/components/ui/Toast';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import type { Product } from '@/lib/types';

type Filter = 'all' | 'hidden' | 'lowStock';

export function AdminProductsPage() {
  const { t, lang } = useLanguage();
  const { can } = useAuth();
  const { general } = useSettings();
  const { navigate } = useRouter();
  const { notify } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useDocumentMeta({ title: `${t('admin.products.title')} | TRONIX Admin` });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminProducts();
      setProducts(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProducts(); }, []);

  const filtered = useMemo(() => {
    let result = products;
    if (filter === 'hidden') result = result.filter((p) => !p.is_visible);
    if (filter === 'lowStock') result = result.filter((p) => p.stock_quantity <= p.low_stock_threshold);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((p) => p.name_en.toLowerCase().includes(q) || p.name_ar.includes(q) || p.sku.toLowerCase().includes(q));
    return result;
  }, [products, filter, search]);

  const money = (value: number) => formatMoney(value, general.currency_code, lang);

  const handleDelete = async (product: Product) => {
    if (!confirm(t('admin.products.confirmDelete'))) return;
    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      notify('success', t('admin.products.deleted'));
    } catch {
      notify('error', t('common.error'));
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      await duplicateProduct(product);
      await loadProducts();
      notify('success', t('admin.products.duplicated'));
    } catch {
      notify('error', t('common.error'));
    }
  };

  if (!can('products')) {
    return <div className="py-16 text-center text-slate-500">{t('admin.noPermission')}</div>;
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={loadProducts} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{t('admin.products.title')}</h1>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          {t('admin.products.new')}
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.products.search')}
            className="input-base ps-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'hidden', 'lowStock'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                filter === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t(`admin.products.filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {general.currency_code === 'USD' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Tip: Change the currency code in Website settings to EGP for the Egyptian market.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">{t('admin.products.empty')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3 text-start">{t('admin.products.table.product')}</th>
                <th className="px-4 py-3 text-start">{t('admin.products.table.category')}</th>
                <th className="px-4 py-3 text-start">{t('admin.products.table.price')}</th>
                <th className="px-4 py-3 text-center">{t('admin.products.table.stock')}</th>
                <th className="px-4 py-3 text-center">{t('admin.products.table.state')}</th>
                <th className="px-4 py-3 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((product) => {
                const img = product.product_images?.[0]?.url;
                const state = stockState(product.stock_quantity, product.low_stock_threshold, product.is_available);
                return (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{localized(product, 'name', lang)}</p>
                          <p className="truncate text-xs text-slate-500">{product.sku}</p>
                        </div>
                        {!product.is_visible && (
                          <EyeOff className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {product.category ? localized(product.category, 'name', lang) : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {money(effectivePrice(product.price, product.sale_price))}
                      {product.sale_price && (
                        <span className="ms-1 text-xs text-slate-400 line-through">{money(product.price)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${state === 'out' ? 'text-brand-600' : state === 'low' ? 'text-amber-600' : 'text-slate-700'}`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {state === 'out' && <Badge tone="red">{t('product.outOfStock')}</Badge>}
                      {state === 'low' && <Badge tone="amber">{t('product.lowStock', { count: product.stock_quantity })}</Badge>}
                      {state === 'in' && <Badge tone="green">{t('product.inStock')}</Badge>}
                      {state === 'unavailable' && <Badge tone="slate">{t('product.unavailable')}</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/products/${product.id}`)}
                          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-700"
                          aria-label={t('common.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(product)}
                          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-700"
                          aria-label={t('common.duplicate')}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-700"
                          aria-label={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
