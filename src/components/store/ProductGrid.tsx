import type { ReactNode } from 'react';
import { ErrorState, LoadingState } from '@/components/ui/PageState';
import { ProductCard } from '@/components/store/ProductCard';
import { Link } from '@/lib/router';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Product } from '@/lib/types';

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold text-steel-900 sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-steel-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ProductGrid({
  products,
  loading,
  error,
  onRetry,
  emptyMessage,
}: {
  products: Product[] | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  emptyMessage: string;
}) {
  const { t } = useLanguage();
  if (error) return <ErrorState onRetry={onRetry} />;
  if (loading || products === null) return <LoadingState />;
  if (products.length === 0) {
    return <p className="py-12 text-center text-sm text-steel-500">{emptyMessage}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4" aria-label={t('shop.allProducts')}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ViewAllLink({ to }: { to: string }) {
  const { t } = useLanguage();
  return (
    <Link to={to} className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 hover:underline">
      {t('home.viewAll')}
    </Link>
  );
}
