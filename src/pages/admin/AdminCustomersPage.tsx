import { useEffect, useMemo, useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { fetchCustomers, fetchCustomerOrders } from '@/api/admin';
import { formatMoney, formatDate } from '@/lib/format';
import { Badge, ErrorState, LoadingState } from '@/components/ui/PageState';
import { Modal } from '@/components/ui/Modal';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import type { Customer, Order } from '@/lib/types';

export function AdminCustomersPage() {
  const { t, lang } = useLanguage();
  const { can } = useAuth();
  const { general } = useSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useDocumentMeta({ title: `${t('admin.customers.title')} | TRONIX Admin` });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      setCustomers(await fetchCustomers());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCustomers(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.full_name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customers, search]);

  const money = (value: number) => formatMoney(value, general.currency_code, lang);

  const openDetail = async (customer: Customer) => {
    setDetailCustomer(customer);
    setOrdersLoading(true);
    try {
      setCustomerOrders(await fetchCustomerOrders(customer.id));
    } catch {
      setCustomerOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  if (!can('customers')) {
    return <div className="py-16 text-center text-slate-500">{t('admin.noPermission')}</div>;
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={loadCustomers} />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('admin.customers.title')}</h1>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.customers.search')}
          className="input-base ps-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">{t('admin.customers.empty')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3 text-start">{t('common.name')}</th>
                <th className="px-4 py-3 text-start">{t('common.phone')}</th>
                <th className="px-4 py-3 text-start">{t('checkout.city')}</th>
                <th className="px-4 py-3 text-center">{t('common.date')}</th>
                <th className="px-4 py-3 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((customer) => (
                <tr key={customer.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDetail(customer)}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{customer.full_name}</td>
                  <td className="px-4 py-3 text-slate-600" dir="ltr">{customer.phone}</td>
                  <td className="px-4 py-3 text-slate-600">{customer.city}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{formatDate(customer.created_at, lang)}</td>
                  <td className="px-4 py-3 text-end">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openDetail(customer); }}
                      className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
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

      {/* Customer Detail Modal */}
      <Modal
        open={!!detailCustomer}
        onClose={() => setDetailCustomer(null)}
        title={detailCustomer?.full_name ?? ''}
        size="lg"
      >
        {detailCustomer && (
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <dl className="flex flex-col gap-1 text-sm">
                  <div><dt className="inline font-medium text-slate-600">{t('common.name')}: </dt><dd className="inline text-slate-900">{detailCustomer.full_name}</dd></div>
                  <div><dt className="inline font-medium text-slate-600">{t('common.phone')}: </dt><dd className="inline text-slate-900" dir="ltr">{detailCustomer.phone}</dd></div>
                  {detailCustomer.email && <div><dt className="inline font-medium text-slate-600">{t('common.email')}: </dt><dd className="inline text-slate-900">{detailCustomer.email}</dd></div>}
                  <div><dt className="inline font-medium text-slate-600">{t('checkout.city')}: </dt><dd className="inline text-slate-900">{detailCustomer.city}</dd></div>
                  <div><dt className="inline font-medium text-slate-600">{t('checkout.address')}: </dt><dd className="inline text-slate-900">{detailCustomer.address}</dd></div>
                </dl>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-600">{t('common.date')}</p>
                <p className="mt-1 text-sm text-slate-900">{formatDate(detailCustomer.created_at, lang, true)}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-700">{t('admin.customers.previous')}</h3>
              {ordersLoading ? (
                <LoadingState />
              ) : customerOrders.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">{t('admin.customers.empty')}</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-start">{t('admin.orders.number')}</th>
                        <th className="px-3 py-2 text-center">{t('common.status')}</th>
                        <th className="px-3 py-2 text-end">{t('common.total')}</th>
                        <th className="px-3 py-2 text-center">{t('admin.orders.placed')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-3 py-2 font-semibold text-slate-900">{order.order_number}</td>
                          <td className="px-3 py-2 text-center"><Badge tone={order.status === 'cancelled' ? 'red' : order.status === 'delivered' ? 'green' : 'amber'}>{t(`admin.orders.status.${order.status}`)}</Badge></td>
                          <td className="px-3 py-2 text-end font-semibold">{money(Number(order.total))}</td>
                          <td className="px-3 py-2 text-center text-slate-600">{formatDate(order.created_at, lang)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
