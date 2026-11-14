import { useEffect, useMemo, useState } from 'react';
import { Search, AlertTriangle, History } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { fetchAdminProducts, adjustStock, fetchStockMovements } from '@/api/admin';
import { productImage } from '@/components/store/ProductCard';
import { localized, formatDate } from '@/lib/format';
import { Badge, ErrorState, LoadingState, Notice } from '@/components/ui/PageState';
import { Field, TextInput, SelectInput, TextArea } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import type { Product, StockMovement } from '@/lib/types';

export function AdminInventoryPage() {
  const { t, lang } = useLanguage();
  const { can } = useAuth();
  const { notify } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);

  // Adjust modal
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [change, setChange] = useState('');
  const [reason, setReason] = useState('restock');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // History modal
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useDocumentMeta({ title: `${t('admin.inventory.title')} | TRONIX Admin` });

  const loadProducts = async () => {
    setLoading(true);
    try {
      setProducts(await fetchAdminProducts());
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
    if (lowOnly) result = result.filter((p) => p.stock_quantity <= p.low_stock_threshold);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((p) => p.name_en.toLowerCase().includes(q) || p.name_ar.includes(q) || p.sku.toLowerCase().includes(q));
    return result;
  }, [products, search, lowOnly]);

  const openHistory = async (product: Product) => {
    setHistoryProduct(product);
    setHistoryLoading(true);
    try {
      setMovements(await fetchStockMovements(product.id));
    } catch {
      setMovements([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjustProduct) return;
    const changeNum = parseInt(change);
    if (isNaN(changeNum) || changeNum === 0) {
      notify('error', t('admin.inventory.zero'));
      return;
    }
    setSaving(true);
    try {
      const newQty = await adjustStock(adjustProduct.id, changeNum, reason, note.trim());
      setProducts((prev) => prev.map((p) => (p.id === adjustProduct.id ? { ...p, stock_quantity: newQty } : p)));
      notify('success', t('admin.inventory.applied'));
      setAdjustProduct(null);
      setChange('');
      setNote('');
      setReason('restock');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      notify('error', msg.includes('negative') ? t('admin.inventory.negative') : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (!can('inventory')) {
    return <div className="py-16 text-center text-slate-500">{t('admin.noPermission')}</div>;
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={loadProducts} />;

  const lowCount = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length;
  const outCount = products.filter((p) => p.stock_quantity <= 0).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('admin.inventory.title')}</h1>
        {(lowCount > 0 || outCount > 0) && (
          <div className="mt-2 flex flex-wrap gap-3">
            {lowCount > 0 && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                {t('admin.inventory.lowAlerts')}: {lowCount}
              </span>
            )}
            {outCount > 0 && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-sm text-brand-800">
                <AlertTriangle className="h-4 w-4" />
                {t('admin.overview.outOfStock')}: {outCount}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.inventory.search')}
            className="input-base ps-10"
          />
        </div>
        <button
          type="button"
          onClick={() => setLowOnly((v) => !v)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${lowOnly ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-300 bg-white text-slate-700'}`}
        >
          {t('admin.inventory.lowOnly')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start">{t('admin.products.table.product')}</th>
              <th className="px-4 py-3 text-center">{t('admin.products.table.stock')}</th>
              <th className="px-4 py-3 text-center">{t('admin.products.table.state')}</th>
              <th className="px-4 py-3 text-end">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((product) => {
              const img = productImage(product);
              const isLow = product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;
              const isOut = product.stock_quantity <= 0;
              return (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{localized(product, 'name', lang)}</p>
                        <p className="truncate text-xs text-slate-500">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-lg font-bold ${isOut ? 'text-brand-600' : isLow ? 'text-amber-600' : 'text-slate-700'}`}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isOut ? <Badge tone="red">{t('product.outOfStock')}</Badge> : isLow ? <Badge tone="amber">{t('product.lowStock', { count: product.stock_quantity })}</Badge> : <Badge tone="green">{t('product.inStock')}</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAdjustProduct(product)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {t('admin.inventory.adjust')}
                      </button>
                      <button
                        type="button"
                        onClick={() => openHistory(product)}
                        className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
                        aria-label={t('admin.inventory.history')}
                      >
                        <History className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Adjust Modal */}
      <Modal
        open={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        title={t('admin.inventory.adjust')}
        footer={
          <>
            <button type="button" onClick={() => setAdjustProduct(null)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="button" onClick={handleAdjust} disabled={saving} className="btn-primary">
              {saving ? t('common.loading') : t('admin.inventory.apply')}
            </button>
          </>
        }
      >
        {adjustProduct && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="font-semibold text-slate-900">{localized(adjustProduct, 'name', lang)}</p>
              <p className="text-xs text-slate-500">{adjustProduct.sku} — {t('admin.products.stockLocked')}: {adjustProduct.stock_quantity}</p>
            </div>
            <Field label={t('admin.inventory.change')} required>
              {(id) => <TextInput id={id} type="number" value={change} onChange={(e) => setChange(e.target.value)} placeholder="+10 or -5" dir="ltr" />}
            </Field>
            <Field label={t('admin.inventory.reason')} required>
              {(id) => (
                <SelectInput id={id} value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="restock">{t('admin.inventory.reason.restock')}</option>
                  <option value="adjustment">{t('admin.inventory.reason.adjustment')}</option>
                  <option value="correction">{t('admin.inventory.reason.correction')}</option>
                </SelectInput>
              )}
            </Field>
            <Field label={t('admin.inventory.note')}>
              {(id) => <TextArea id={id} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}
            </Field>
          </div>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        open={!!historyProduct}
        onClose={() => setHistoryProduct(null)}
        title={t('admin.inventory.history')}
        size="lg"
      >
        {historyLoading ? (
          <LoadingState />
        ) : movements.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('admin.inventory.historyEmpty')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    <span className={m.change_qty > 0 ? 'text-emerald-600' : 'text-brand-600'}>
                      {m.change_qty > 0 ? '+' : ''}{m.change_qty}
                    </span>
                    <span className="ms-2 text-slate-500">→ {m.resulting_qty}</span>
                  </p>
                  <p className="text-xs text-slate-500">{t(`admin.inventory.reason.${m.reason}`)} — {formatDate(m.created_at, lang, true)}</p>
                  {m.note && <p className="mt-1 text-xs text-slate-400">{m.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
