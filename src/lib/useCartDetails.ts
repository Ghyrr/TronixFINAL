import { useEffect, useRef, useState } from 'react';
import { fetchProductsByIds } from '@/api/catalog';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/context/SettingsContext';
import { effectivePrice } from '@/lib/format';
import type { Product } from '@/lib/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

export type CartAdjustment = 'none' | 'removed' | 'reduced';

type CartState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; items: CartItem[] };

export function useCartDetails() {
  const { lines, replaceLines } = useCart();
  const { general } = useSettings();
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const linesKey = lines.map((line) => `${line.productId}:${line.quantity}`).join(',');

  const [state, setState] = useState<CartState>({ status: 'loading' });
  const [adjustment, setAdjustment] = useState<CartAdjustment>('none');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const current = linesRef.current;
    if (current.length === 0) {
      setState({ status: 'ready', items: [] });
      return;
    }

    fetchProductsByIds(current.map((line) => line.productId))
      .then((rows) => {
        if (cancelled) return;
        const byId = new Map(rows.map((row) => [row.id, row]));
        const items: CartItem[] = [];
        let removed = false;
        let reduced = false;

        for (const line of linesRef.current) {
          const product = byId.get(line.productId);
          if (!product || !product.is_visible || !product.is_available || product.stock_quantity <= 0) {
            removed = true;
            continue;
          }
          const quantity = Math.min(line.quantity, product.stock_quantity);
          if (quantity !== line.quantity) reduced = true;
          items.push({ product, quantity });
        }

        if (removed || reduced) {
          setAdjustment(removed ? 'removed' : 'reduced');
          replaceLines(items.map((item) => ({ productId: item.product.id, quantity: item.quantity })));
        }
        setState({ status: 'ready', items });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [linesKey, attempt, replaceLines]);

  const items = state.status === 'ready' ? state.items : [];
  const subtotal = items.reduce((sum, item) => sum + effectivePrice(item.product.price, item.product.sale_price) * item.quantity, 0);
  const freeDelivery = general.free_delivery_threshold > 0 && subtotal >= general.free_delivery_threshold;
  const delivery = items.length === 0 || freeDelivery ? 0 : general.delivery_fee;

  return {
    status: state.status,
    items,
    subtotal,
    delivery,
    total: subtotal + delivery,
    adjustment,
    retry: () => setAttempt((value) => value + 1),
  };
}
