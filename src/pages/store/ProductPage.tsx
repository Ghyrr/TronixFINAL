import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { fetchProductBySlug, fetchProducts } from '@/api/catalog';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/Toast';
import { Link } from '@/lib/router';
import { localized } from '@/lib/format';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/PageState';
import { PriceTag, ProductCard, StockBadge } from '@/components/store/ProductCard';
import { SectionHeading } from '@/components/store/ProductGrid';
import type { Product } from '@/lib/types';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'missing' } | { status: 'ready'; product: Product };

export function ProductPage({ slug }: { slug: string }) {
  const { t, lang } = useLanguage();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchProductBySlug(slug)
      .then((product) => {
        if (!cancelled) setState(product ? { status: 'ready', product } : { status: 'missing' });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  if (state.status === 'loading') return <div className="py-24"><LoadingState /></div>;
  if (state.status === 'error') return <div className="py-24"><ErrorState onRetry={() => setAttempt((v) => v + 1)} /></div>;
  if (state.status === 'missing') {
    return <EmptyState message={t('product.notFound')} action={<Link to="/shop" className="btn-primary">{t('product.backToShop')}</Link>} />;
  }
  return <ProductDetail key={state.product.id} product={state.product} lang={lang} />;
}

function ProductDetail({ product, lang }: { product: Product; lang: 'ar' | 'en' }) {
  const { t } = useLanguage();
  const { lines, addItem } = useCart();
  const { notify } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [related, setRelated] = useState<Product[]>([]);

  const name = localized(product, 'name', lang);
  const description = localized(product, 'description', lang);
  const images = useMemo(() => [...product.product_images].sort((a, b) => a.sort_order - b.sort_order), [product.product_images]);
  const inCart = lines.find((line) => line.productId === product.id)?.quantity ?? 0;
  const maxQuantity = Math.max(0, Math.min(99, product.stock_quantity - inCart));
  const canBuy = product.is_available && maxQuantity > 0;

  useDocumentMeta({ title: `${name} | TRONIX`, description: description || name });

  useEffect(() => {
    if (!product.category_id) return;
    let cancelled = false;
    fetchProducts({ categoryId: product.category_id, limit: 8 })
      .then((items) => {
        if (!cancelled) setRelated(items.filter((item) => item.id !== product.id).slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product.id, product.category_id]);

  const handleAdd = () => {
    addItem(product.id, quantity);
    notify('success', t('product.added'));
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="breadcrumb" className="mb-6 flex flex-wrap gap-2 text-sm text-steel-500">
        <Link to="/shop" className="hover:text-brand-600">{t('shop.title')}</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/category/${product.category.slug}`} className="hover:text-brand-600">{localized(product.category, 'name', lang)}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-steel-800">{name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="aspect-square overflow-hidden rounded-2xl border border-steel-200 bg-steel-100">
            {images[activeImage] ? (
              <img src={images[activeImage].url} alt={name} className="h-full w-full object-cover transition-opacity duration-300" />
            ) : (
              <span className="flex h-full items-center justify-center text-sm text-steel-400">{t('product.noImage')}</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`${index + 1}`}
                  className={`aspect-square overflow-hidden rounded-lg border-2 bg-steel-100 transition-colors ${index === activeImage ? 'border-brand-600' : 'border-transparent hover:border-steel-300'}`}
                >
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {product.brand && <span className="text-xs font-semibold uppercase tracking-wider text-steel-500">{product.brand.name}</span>}
          <h1 className="text-3xl font-bold leading-tight text-steel-900">{name}</h1>
          <p className="text-sm text-steel-500">{t('product.sku')}: <span className="font-mono text-steel-700">{product.sku}</span></p>
          <PriceTag product={product} />
          <StockBadge product={product} />

          {description && <p className="leading-relaxed text-steel-600">{description}</p>}

          <div className="flex flex-col gap-3 border-t border-steel-200 pt-6 sm:flex-row sm:items-center">
            <div className="inline-flex w-fit items-center rounded-lg border border-steel-300">
              <button type="button" aria-label="-" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-3 text-steel-600 hover:text-brand-600">
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="w-12 text-center font-semibold" aria-live="polite">{quantity}</span>
              <button type="button" aria-label="+" onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))} disabled={quantity >= maxQuantity} className="p-3 text-steel-600 hover:text-brand-600 disabled:opacity-40">
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <button type="button" onClick={handleAdd} disabled={!canBuy} className="btn-primary flex-1 py-3">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              {canBuy ? t('product.addToCart') : t('product.outOfStock')}
            </button>
          </div>
          {inCart > 0 && maxQuantity === 0 && <p className="text-sm text-amber-700">{t('product.maxReached')}</p>}

          {product.compatible_models.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-steel-900">{t('product.compatibleModels')}</h2>
              <ul className="flex flex-wrap gap-2">
                {product.compatible_models.map((model) => (
                  <li key={model} className="rounded-md bg-steel-100 px-3 py-1 text-sm text-steel-700">{model}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {product.specifications.length > 0 && (
        <section className="mt-14" aria-labelledby="specs-title">
          <h2 id="specs-title" className="mb-4 text-2xl font-bold text-steel-900">{t('product.specifications')}</h2>
          <dl className="grid overflow-hidden rounded-xl border border-steel-200 bg-white sm:grid-cols-2">
            {product.specifications.map((spec, index) => (
              <div key={index} className="flex justify-between gap-4 border-b border-steel-100 px-5 py-3 text-sm even:bg-steel-50 sm:odd:border-e">
                <dt className="font-medium text-steel-500">{localized(spec, 'label', lang)}</dt>
                <dd className="text-end font-semibold text-steel-900">{localized(spec, 'value', lang)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeading title={t('product.related')} />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
