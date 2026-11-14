import { useState } from 'react';
import { Eye, ShoppingBag } from 'lucide-react';
import { Link } from '@/lib/router';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useCart } from '@/context/CartContext';
import { discountPercent, effectivePrice, formatMoney, localized, stockState } from '@/lib/format';
import type { Product } from '@/lib/types';
import { QuickViewModal } from '@/components/store/QuickViewModal';

export function productImage(product: Product): string | null {
  const images = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
  return images[0]?.url ?? null;
}

export function StockBadge({ product }: { product: Product }) {
  const { t } = useLanguage();
  const state = stockState(product.stock_quantity, product.low_stock_threshold, product.is_available);
  const map = {
    in: { text: t('product.inStock'), className: 'text-emerald-700' },
    low: { text: t('product.lowStock', { count: product.stock_quantity }), className: 'text-amber-700' },
    out: { text: t('product.outOfStock'), className: 'text-brand-600' },
    unavailable: { text: t('product.unavailable'), className: 'text-steel-500' },
  } as const;
  const entry = map[state];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${entry.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {entry.text}
    </span>
  );
}

export function PriceTag({ product }: { product: Product }) {
  const { lang, t } = useLanguage();
  const { general } = useSettings();
  const current = effectivePrice(product.price, product.sale_price);
  const onSale = current < product.price;
  const percent = discountPercent(product.price, product.sale_price);
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-lg font-extrabold text-steel-900">{formatMoney(current, general.currency_code, lang)}</span>
        {onSale && (
          <span className="text-sm font-medium text-steel-400 line-through">{formatMoney(product.price, general.currency_code, lang)}</span>
        )}
      </div>
      {onSale && (
        <span className="text-xs font-bold text-brand-600">
          {t('product.save', { percent })}
        </span>
      )}
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { lang, t } = useLanguage();
  const { lines, addItem } = useCart();
  const [quickView, setQuickView] = useState(false);
  const image = productImage(product);
  const name = localized(product, 'name', lang);
  const inCart = lines.find((line) => line.productId === product.id)?.quantity ?? 0;
  const canBuy = product.is_available && product.stock_quantity > inCart;
  const percent = discountPercent(product.price, product.sale_price);
  const onSale = percent > 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-steel-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lift hover:border-steel-300">
      <div className="relative aspect-square overflow-hidden bg-steel-50">
        <Link to={`/product/${product.slug}`} className="block h-full w-full" aria-label={name}>
          {image ? (
            <img src={image} alt={name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <span className="flex h-full items-center justify-center text-sm text-steel-400">{t('product.noImage')}</span>
          )}
        </Link>
        {/* SALE badge with discount percentage on the image */}
        {onSale && (
          <div className="absolute start-3 top-3 flex flex-col items-stretch gap-1">
            <span className="badge-sale">SALE</span>
            <span className="inline-flex items-center justify-center rounded-md bg-steel-900/90 px-2.5 py-1 text-xs font-extrabold text-white shadow-sm">
              -{percent}%
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setQuickView(true)}
          className="absolute end-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-steel-800 opacity-100 shadow-sm transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          {t('product.quickView')}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          {product.brand && <span className="text-xs font-medium uppercase tracking-wide text-steel-500">{product.brand.name}</span>}
          <Link to={`/product/${product.slug}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-steel-900 transition-colors hover:text-brand-600">
            {name}
          </Link>
        </div>
        <PriceTag product={product} />
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <StockBadge product={product} />
        </div>
        <button
          type="button"
          onClick={() => addItem(product.id)}
          disabled={!canBuy}
          className="btn-primary w-full py-2.5"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          {canBuy ? t('product.addToCart') : t('product.outOfStock')}
        </button>
      </div>

      {quickView && <QuickViewModal product={product} onClose={() => setQuickView(false)} />}
    </article>
  );
}
