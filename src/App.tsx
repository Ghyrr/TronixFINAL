import { StoreLayout } from '@/components/store/StoreLayout';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { EmptyState } from '@/components/ui/PageState';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Link, matchPath, useRouter } from '@/lib/router';
import { AboutPage, ContactPage } from '@/pages/store/InfoPages';
import { CartPage } from '@/pages/store/CartPage';
import { CheckoutPage } from '@/pages/store/CheckoutPage';
import { HomePage } from '@/pages/store/HomePage';
import { OrderSuccessPage } from '@/pages/store/OrderSuccessPage';
import { PolicyPage, type PolicyKind } from '@/pages/store/PolicyPage';
import { ProductPage } from '@/pages/store/ProductPage';
import { ShopPage } from '@/pages/store/ShopPage';
import { AdminSignInPage } from '@/pages/admin/AdminSignInPage';
import { AdminSetupPage } from '@/pages/admin/AdminSetupPage';
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminProductEditPage } from '@/pages/admin/AdminProductEditPage';
import { AdminInventoryPage } from '@/pages/admin/AdminInventoryPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminCustomersPage } from '@/pages/admin/AdminCustomersPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminAdminsPage } from '@/pages/admin/AdminAdminsPage';
import { AdminActivityPage } from '@/pages/admin/AdminActivityPage';
import type { ReactNode } from 'react';

function NotFound() {
  const { t } = useLanguage();
  return (
    <EmptyState
      message={`${t('notfound.title')}. ${t('notfound.body')}`}
      action={<Link to="/" className="btn-primary">{t('nav.home')}</Link>}
    />
  );
}

function renderStoreRoute(pathname: string): ReactNode {
  const exact: Record<string, ReactNode> = {
    '/': <HomePage />,
    '/shop': <ShopPage />,
    '/cart': <CartPage />,
    '/checkout': <CheckoutPage />,
    '/order-success': <OrderSuccessPage />,
    '/about': <AboutPage />,
    '/contact': <ContactPage />,
    '/privacy': <PolicyPage kind={'privacy' satisfies PolicyKind} />,
    '/terms': <PolicyPage kind={'terms' satisfies PolicyKind} />,
    '/returns': <PolicyPage kind={'returns' satisfies PolicyKind} />,
  };
  if (exact[pathname]) return exact[pathname];

  const category = matchPath('/category/:slug', pathname);
  if (category) return <ShopPage categorySlug={category.slug} />;
  const brand = matchPath('/brand/:slug', pathname);
  if (brand) return <ShopPage brandSlug={brand.slug} />;
  const product = matchPath('/product/:slug', pathname);
  if (product) return <ProductPage slug={product.slug} />;

  return <NotFound />;
}

function renderAdminRoute(pathname: string): ReactNode {
  const exact: Record<string, ReactNode> = {
    '/admin': <AdminOverviewPage />,
    '/admin/products': <AdminProductsPage />,
    '/admin/products/new': <AdminProductEditPage />,
    '/admin/inventory': <AdminInventoryPage />,
    '/admin/orders': <AdminOrdersPage />,
    '/admin/customers': <AdminCustomersPage />,
    '/admin/settings': <AdminSettingsPage />,
    '/admin/admins': <AdminAdminsPage />,
    '/admin/activity': <AdminActivityPage />,
  };
  if (exact[pathname]) return exact[pathname];

  const productEdit = matchPath('/admin/products/:id', pathname);
  if (productEdit) return <AdminProductEditPage productId={productEdit.id} />;

  return <NotFound />;
}

function AdminRoute({ pathname }: { pathname: string }) {
  const { status, admin } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-steel-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-steel-300 border-t-brand-600" />
      </div>
    );
  }

  if (status === 'signed_out' || !admin) {
    if (pathname === '/admin/setup') return <AdminSetupPage />;
    return <AdminSignInPage />;
  }

  if (!admin.is_active) {
    return <AdminSignInPage />;
  }

  return <AdminLayout activePath={pathname}>{renderAdminRoute(pathname)}</AdminLayout>;
}

export default function App() {
  const { location } = useRouter();
  const pathname = location.pathname.replace(/\/+$/, '') || '/';

  if (pathname.startsWith('/admin')) {
    return <AdminRoute pathname={pathname} />;
  }

  return <StoreLayout>{renderStoreRoute(pathname)}</StoreLayout>;
}
