import { useEffect, useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  Settings,
  ShieldCheck,
  ScrollText,
  LogOut,
  Menu,
  X,
  Store,
} from 'lucide-react';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import type { PermissionKey } from '@/lib/types';
import type { TranslationKey } from '@/i18n/translations';

interface NavItem {
  to: string;
  label: TranslationKey;
  icon: typeof LayoutDashboard;
  permission?: PermissionKey;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'admin.nav.overview', icon: LayoutDashboard },
  { to: '/admin/products', label: 'admin.nav.products', icon: Package, permission: 'products' },
  { to: '/admin/inventory', label: 'admin.nav.inventory', icon: Boxes, permission: 'inventory' },
  { to: '/admin/orders', label: 'admin.nav.orders', icon: ShoppingCart, permission: 'orders' },
  { to: '/admin/customers', label: 'admin.nav.customers', icon: Users, permission: 'customers' },
  { to: '/admin/settings', label: 'admin.nav.settings', icon: Settings, permission: 'settings' },
  { to: '/admin/admins', label: 'admin.nav.admins', icon: ShieldCheck, superAdminOnly: true },
  { to: '/admin/activity', label: 'admin.nav.activity', icon: ScrollText, superAdminOnly: true },
];

export function AdminLayout({ children, activePath }: { children: ReactNode; activePath: string }) {
  const { admin, signOut, can } = useAuth();
  const { t } = useLanguage();
  const { navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [activePath]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/signin');
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || can(item.permission) || admin?.role === 'super_admin',
  ).filter((item) => !item.superAdminOnly || admin?.role === 'super_admin');

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 start-0 z-40 w-64 transform bg-slate-900 transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-5">
          <Link to="/admin" className="flex items-center gap-2 text-white">
            <Store className="h-6 w-6 text-brand-400" />
            <span className="text-lg font-bold">TRONIX</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto p-3">
          {visibleItems.map((item) => {
            const isActive = activePath === item.to || (item.to !== '/admin' && activePath.startsWith(item.to));
            const Icon = item.icon;
            const accessible = !item.permission || can(item.permission) || admin?.role === 'super_admin';
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : accessible
                      ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-600'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-slate-700 p-3">
          <div className="mb-3 px-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-200">{admin?.full_name}</p>
            <p>{admin?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {t('auth.signOut')}
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ms-auto flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.nav.viewStore')}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
