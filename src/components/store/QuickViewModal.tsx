import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ui/Toast';
import { localized } from '@/lib/format';
import type { Product } from '@/lib/types';
import { PriceTag, StockBadge, productImage } from '@/components/store/ProductCard';
import { Link } from '@/lib/router';

export function QuickViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { t, lang } = useLanguage();
  const { addItem, lines } = useCart();
  const { notify } = useToast();
  const [quantity, setQuantity] = useState(1);
  const name = localized(product, 'name', lang);
  const description = localized(product, 'description', lang);
  const image = productImage(product);
  const inCart = lines.find((line) => line.productId === product.id)?.quantity ?? 0;
  const maxQuantity = Math.max(0, Math.min(99, product.stock_quantity - inCart));
  const canBuy = product.is_available && maxQuantity > 0;

  const handleAdd = () => {
    addItem(product.id, quantity);
    notify('success', t('product.added'));
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={name} size="lg">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-steel-50">
          {image && <img src={image} alt={name} className="h-full w-full object-cover" />}
        </div>
        <div className="flex flex-col gap-4">
          {product.brand && <span className="text-xs font-medium uppercase tracking-wide text-steel-500">{product.brand.name}</span>}
          <PriceTag product={product} />
          <StockBadge product={product} />
          {description && <p className="line-clamp-4 text-sm leading-relaxed text-steel-600">{description}</p>}
          <div className="mt-auto flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-steel-700">{t('product.quantity')}</span>
              <div className="inline-flex items-center rounded-lg border border-steel-300">
                <button type="button" aria-label="-" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-2.5 text-steel-600 hover:text-brand-600">
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="w-10 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  aria-label="+"
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  disabled={quantity >= maxQuantity}
                  className="p-2.5 text-steel-600 hover:text-brand-600 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <button type="button" onClick={handleAdd} disabled={!canBuy} className="btn-primary w-full">
              {canBuy ? t('product.addToCart') : t('product.outOfStock')}
            </button>
            <Link to={`/product/${product.slug}`} onClick={onClose} className="text-center text-sm font-medium text-brand-600 hover:underline">
              {t('product.viewDetails')}
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
