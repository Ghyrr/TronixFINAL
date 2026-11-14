import { useEffect, useMemo, useState } from 'react';
import { Search, Eye, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { fetchAdminOrders, fetchOrderItems, setOrderStatus } from '@/api/admin';
import { formatMoney, formatDate, localized } from '@/lib/format';
import { Badge, ErrorState, LoadingState, Notice } from '@/components/ui/PageState';
import { SelectInput } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import type { Order, OrderItem, OrderStatus } from '@/lib/types';
import { ORDER_STATUSES } from '@/lib/types';

const STATUS_BADGE: Record<OrderStatus, 'amber' | 'blue' | 'slate' | 'green' | 'red'> = {
  pending: 'amber', confirmed: 'blue', processing: 'slate', shipped: 'blue', delivered: 'green', cancelled: 'red',
};

const CLOSED_STATUSES: OrderStatus[] = ['delivered', 'cancelled'];

export function AdminOrdersPage() {
  const { t, lang } = useLanguage();
  const { can } = useAuth();
  const { general } = useSettings();
  const { notify } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useDocumentMeta({ title: `${t('admin.orders.title')} | TRONIX Admin` });

  const loadOrders = async () => {
    setLoading(true);
    try {
      setOrders(await fetchAdminOrders());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadOrders(); }, []);

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'all') result = result.filter((o) => o.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((o) => o.order_number.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.customer_phone.includes(q));
    return result;
  }, [orders, search, statusFilter]);

  const money = (value: number) => formatMoney(value, general.currency_code, lang);

  const openDetail = async (order: Order) => {
    setDetailOrder(order);
    setItemsLoading(true);
    try {
      setItems(await fetchOrderItems(order.id));
    } catch {
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleStatusChange = async (order: Order, status: OrderStatus) => {
    if (CLOSED_STATUSES.includes(order.status)) {
      notify('error', t('admin.orders.closed'));
      return;
    }
    if (status === 'cancelled' && !confirm(t('admin.orders.cancelWarning'))) return;

    setUpdatingStatus(true);
    try {
      await setOrderStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
      setDetailOrder((prev) => prev ? { ...prev, status } : null);
      notify('success', t('admin.orders.statusUpdated'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      notify('error', msg.includes('closed') ? t('admin.orders.closed') : t('common.error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!can('orders')) {
    return <div className="py-16 text-center text-slate-500">{t('admin.noPermission')}</div>;
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={loadOrders} />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('admin.orders.title')}</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.orders.search')}
            className="input-base ps-10"
          />
        </div>
        <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')} className="w-auto">
          <option value="all">{t('admin.orders.all')}</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{t(`admin.orders.status.${s}`)}</option>
          ))}
        </SelectInput>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">{t('admin.orders.empty')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3 text-start">{t('admin.orders.number')}</th>
                <th className="px-4 py-3 text-start">{t('admin.orders.customer')}</th>
                <th className="px-4 py-3 text-start">{t('admin.orders.placed')}</th>
                <th className="px-4 py-3 text-center">{t('common.status')}</th>
                <th className="px-4 py-3 text-end">{t('common.total')}</th>
                <th className="px-4 py-3 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((order) => (
                <tr key={order.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDetail(order)}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{order.order_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{order.customer_name}</p>
                    <p className="text-xs text-slate-500" dir="ltr">{order.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(order.created_at, lang)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge tone={STATUS_BADGE[order.status]}>{t(`admin.orders.status.${order.status}`)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-end font-bold text-slate-900">{money(Number(order.total))}</td>
                  <td className="px-4 py-3 text-end">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openDetail(order); }}
                      className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
                      aria-label={t('admin.orders.details')}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title={detailOrder ? `${t('admin.orders.details')} — ${detailOrder.order_number}` : ''}
        size="xl"
      >
        {detailOrder && (
          <div className="flex flex-col gap-5">
            {/* Status update */}
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-slate-700">{t('admin.orders.updateStatus')}:</span>
                <Badge tone={STATUS_BADGE[detailOrder.status]}>{t(`admin.orders.status.${detailOrder.status}`)}</Badge>
                {CLOSED_STATUSES.includes(detailOrder.status) ? (
                  <span className="text-xs text-slate-400">{t('admin.orders.closed')}</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ORDER_STATUSES.filter((s) => s !== detailOrder.status).map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange(detailOrder, s)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                      >
                        {t(`admin.orders.status.${s}`)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Customer info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <h3 className="mb-2 text-sm font-bold text-slate-700">{t('admin.orders.customer')}</h3>
                <dl className="flex flex-col gap-1 text-sm">
                  <div><dt className="inline font-medium text-slate-600">{t('checkout.fullName')}: </dt><dd className="inline text-slate-900">{detailOrder.customer_name}</dd></div>
                  <div><dt className="inline font-medium text-slate-600">{t('checkout.phone')}: </dt><dd className="inline text-slate-900" dir="ltr">{detailOrder.customer_phone}</dd></div>
                  <div><dt className="inline font-medium text-slate-600">{t('checkout.city')}: </dt><dd className="inline text-slate-900">{detailOrder.city}</dd></div>
                  <div><dt className="inline font-medium text-slate-600">{t('checkout.address')}: </dt><dd className="inline text-slate-900">{detailOrder.address}</dd></div>
                  <div><dt className="inline font-medium text-slate-600">{t('admin.orders.payment')}: </dt><dd className="inline text-slate-900">{t(`checkout.${detailOrder.payment_method}`)}</dd></div>
                </dl>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <h3 className="mb-2 text-sm font-bold text-slate-700">{t('admin.orders.placed')}</h3>
                <p className="text-sm text-slate-900">{formatDate(detailOrder.created_at, lang, true)}</p>
                {detailOrder.notes && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-600">{t('checkout.notes')}:</p>
                    <p className="mt-1 text-sm text-slate-900">{detailOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-700">{t('admin.orders.items')}</h3>
              {itemsLoading ? (
                <LoadingState />
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-start">{t('admin.products.table.product')}</th>
                        <th className="px-3 py-2 text-center">{t('product.quantity')}</th>
                        <th className="px-3 py-2 text-end">{t('common.price')}</th>
                        <th className="px-3 py-2 text-end">{t('common.total')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">
                            <p className="font-medium text-slate-800">{localized(item, 'name', lang)}</p>
                            <p className="text-xs text-slate-500">{item.sku}</p>
                          </td>
                          <td className="px-3 py-2 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-end">{money(Number(item.unit_price))}</td>
                          <td className="px-3 py-2 text-end font-semibold">{money(Number(item.line_total))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">{t('cart.subtotal')}</span><span className="font-semibold">{money(Number(detailOrder.subtotal))}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">{t('admin.orders.delivery')}</span><span className="font-semibold">{money(Number(detailOrder.delivery_fee))}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base"><span className="font-bold">{t('cart.total')}</span><span className="font-bold">{money(Number(detailOrder.total))}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
