import { useEffect, useState } from 'react';
import { Package, ShoppingCart, Users, DollarSign, AlertTriangle, PackageX, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { Link } from '@/lib/router';
import { fetchAdminProducts, fetchAdminOrders, fetchCustomers } from '@/api/admin';
import { formatMoney, formatDate, effectivePrice } from '@/lib/format';
import { Badge, LoadingState, ErrorState } from '@/components/ui/PageState';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import type { Order, Product, Customer, OrderStatus } from '@/lib/types';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalSales: number;
  lowStock: number;
  outOfStock: number;
  recentOrders: Order[];
  statusCounts: Record<OrderStatus, number>;
}

export function AdminOverviewPage() {
  const { t, lang } = useLanguage();
  const { admin } = useAuth();
  const { general } = useSettings();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useDocumentMeta({ title: `${t('admin.nav.overview')} | TRONIX Admin` });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [products, orders, customers] = await Promise.all([
          fetchAdminProducts(),
          fetchAdminOrders(),
          fetchCustomers(),
        ]);
        if (cancelled) return;

        const activeOrders = orders.filter((o) => o.status !== 'cancelled');
        const totalSales = activeOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const lowStock = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length;
        const outOfStock = products.filter((p) => p.stock_quantity <= 0).length;
        const recentOrders = orders.slice(0, 8);
        const statusCounts: Record<OrderStatus, number> = {
          pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0,
        };
        orders.forEach((o) => { statusCounts[o.status]++; });

        setStats({ totalProducts: products.length, totalOrders: orders.length, totalCustomers: customers.length, totalSales, lowStock, outOfStock, recentOrders, statusCounts });
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingState />;
  if (error || !stats) return <ErrorState />;
  const money = (value: number) => formatMoney(value, general.currency_code, lang);

  const statCards = [
    { label: t('admin.overview.products'), value: stats.totalProducts, icon: Package, color: 'bg-sky-50 text-sky-700' },
    { label: t('admin.overview.orders'), value: stats.totalOrders, icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-700' },
    { label: t('admin.overview.customers'), value: stats.totalCustomers, icon: Users, color: 'bg-violet-50 text-violet-700' },
    { label: t('admin.overview.sales'), value: money(stats.totalSales), icon: DollarSign, color: 'bg-amber-50 text-amber-700' },
  ];

  const statusBadge: Record<OrderStatus, 'amber' | 'blue' | 'slate' | 'green' | 'red'> = {
    pending: 'amber', confirmed: 'blue', processing: 'slate', shipped: 'blue', delivered: 'green', cancelled: 'red',
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('admin.nav.overview')}</h1>
        <p className="mt-1 text-sm text-slate-600">{admin?.full_name}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stock alerts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t('admin.overview.lowStock')}
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
              <span className="text-sm text-slate-700">{t('admin.overview.lowStock')}</span>
              <Badge tone="amber">{stats.lowStock}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2">
              <span className="text-sm text-slate-700">{t('admin.overview.outOfStock')}</span>
              <Badge tone="red">{stats.outOfStock}</Badge>
            </div>
            <Link to="/admin/inventory" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
              {t('admin.nav.inventory')}
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>

        {/* Orders by status */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-900">{t('admin.overview.salesByStatus')}</h2>
          <div className="flex flex-col gap-2">
            {(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map((status) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{t(`admin.orders.status.${status}`)}</span>
                <Badge tone={statusBadge[status]}>{stats.statusCounts[status]}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">{t('admin.overview.recentOrders')}</h2>
            <Link to="/admin/orders" className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
              {t('admin.overview.viewAll')}
              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">{t('admin.orders.empty')}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {stats.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{order.order_number}</p>
                    <p className="truncate text-xs text-slate-500">{order.customer_name}</p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-sm font-bold text-slate-900">{money(Number(order.total))}</p>
                    <Badge tone={statusBadge[order.status]}>{t(`admin.orders.status.${order.status}`)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">{t('admin.overview.noSales')}</p>
    </div>
  );
}
