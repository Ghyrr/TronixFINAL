import { Minus, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { Link } from '@/lib/router';
import { effectivePrice, formatMoney, localized } from '@/lib/format';
import { useCartDetails, type CartItem } from '@/lib/useCartDetails';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import { EmptyState, ErrorState, LoadingState, Notice } from '@/components/ui/PageState';
import { productImage } from '@/components/store/ProductCard';

export function CartPage() {
  const { t, lang } = useLanguage();
  const { general } = useSettings();
  const { setQuantity, removeItem } = useCart();
  const cart = useCartDetails();

  useDocumentMeta({ title: `${t('cart.title')} | TRONIX`, description: t('cart.title') });

  if (cart.status === 'loading') return <div className="py-24"><LoadingState /></div>;
  if (cart.status === 'error') return <div className="py-24"><ErrorState onRetry={cart.retry} /></div>;

  if (cart.items.length === 0) {
    return (
      <EmptyState
        message={t('cart.empty')}
        action={<Link to="/shop" className="btn-primary">{t('cart.continue')}</Link>}
      />
    );
  }

  const money = (value: number) => formatMoney(value, general.currency_code, lang);
  const remaining = general.free_delivery_threshold - cart.subtotal;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-steel-900">{t('cart.title')}</h1>

      {cart.adjustment !== 'none' && (
        <div className="mb-6">
          <Notice tone="info">{t(cart.adjustment === 'removed' ? 'cart.unavailableItem' : 'cart.stockAdjusted')}</Notice>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col divide-y divide-steel-200 rounded-2xl border border-steel-200 bg-white">
          {cart.items.map((item) => (
            <CartRow
              key={item.product.id}
              item={item}
              money={money}
              onQuantity={(quantity) => setQuantity(item.product.id, quantity)}
              onRemove={() => removeItem(item.product.id)}
            />
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-steel-200 bg-white p-6 shadow-card lg:sticky lg:top-24">
          <h2 className="mb-5 text-lg font-bold text-steel-900">{t('checkout.summary')}</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between"><dt className="text-steel-600">{t('cart.subtotal')}</dt><dd className="font-semibold">{money(cart.subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-steel-600">{t('cart.delivery')}</dt>
              <dd className="font-semibold">{cart.delivery === 0 ? t('cart.free') : money(cart.delivery)}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-steel-200 pt-4 text-base">
              <dt className="font-bold text-steel-900">{t('cart.total')}</dt>
              <dd className="font-bold text-steel-900">{money(cart.total)}</dd>
            </div>
          </dl>
          {general.free_delivery_threshold > 0 && cart.delivery > 0 && remaining > 0 && (
            <p className="mt-4 rounded-lg bg-steel-50 p-3 text-xs text-steel-600">
              {t('cart.freeDeliveryHint', { amount: money(general.free_delivery_threshold) })}
            </p>
          )}
          <Link to="/checkout" className="btn-primary mt-6 w-full py-3">{t('cart.checkout')}</Link>
          <Link to="/shop" className="mt-3 block text-center text-sm font-medium text-brand-600 hover:underline">{t('cart.continue')}</Link>
        </aside>
      </div>
    </div>
  );
}

function CartRow({
  item,
  money,
  onQuantity,
  onRemove,
}: {
  item: CartItem;
  money: (value: number) => string;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const { t, lang } = useLanguage();
  const { product, quantity } = item;
  const image = productImage(product);
  const name = localized(product, 'name', lang);
  const unit = effectivePrice(product.price, product.sale_price);
  const max = Math.min(99, product.stock_quantity);

  return (
    <li className="flex gap-4 p-4 sm:gap-6 sm:p-5">
      <Link to={`/product/${product.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-steel-100">
        {image && <img src={image} alt={name} className="h-full w-full object-cover" />}
      </Link>
      <div className="flex flex-1 flex-col justify-between gap-3">
        <div className="flex justify-between gap-4">
          <div>
            <Link to={`/product/${product.slug}`} className="font-semibold text-steel-900 hover:text-brand-600">{name}</Link>
            <p className="mt-1 text-xs text-steel-500">{t('product.sku')}: {product.sku}</p>
          </div>
          <p className="font-semibold text-steel-900">{money(unit * quantity)}</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center rounded-lg border border-steel-300">
            <button type="button" aria-label="-" onClick={() => onQuantity(quantity - 1)} disabled={quantity <= 1} className="p-2 text-steel-600 hover:text-brand-600 disabled:opacity-40">
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-10 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
            <button type="button" aria-label="+" onClick={() => onQuantity(quantity + 1)} disabled={quantity >= max} className="p-2 text-steel-600 hover:text-brand-600 disabled:opacity-40">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 text-sm font-medium text-steel-500 transition-colors hover:text-brand-600">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t('cart.remove')}
          </button>
        </div>
      </div>
    </li>
  );
}
