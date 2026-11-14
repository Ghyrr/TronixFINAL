import { supabase } from '@/lib/supabase';

export interface CheckoutCustomer {
  full_name: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
  governorate_id?: string;
}

export interface PlacedOrder {
  order_number: string;
  total: number;
  duplicate: boolean;
}

export type OrderErrorCode = 'stock' | 'unavailable' | 'network' | 'generic';

export class OrderError extends Error {
  code: OrderErrorCode;
  constructor(code: OrderErrorCode) {
    super(code);
    this.code = code;
  }
}

function mapOrderError(message: string): OrderErrorCode {
  if (message.includes('insufficient_stock')) return 'stock';
  if (message.includes('product_unavailable')) return 'unavailable';
  return 'generic';
}

export async function placeOrder(
  customer: CheckoutCustomer,
  items: { product_id: string; quantity: number }[],
  paymentMethod: 'cod' | 'whatsapp',
  idempotencyKey: string,
): Promise<PlacedOrder> {
  let result;
  try {
    result = await supabase.rpc('place_order', {
      p: {
        ...customer,
        items,
        payment_method: paymentMethod,
        idempotency_key: idempotencyKey,
      },
    });
  } catch {
    throw new OrderError('network');
  }

  const { data, error } = result;
  if (error) throw new OrderError(mapOrderError(error.message));

  const placed = data as Partial<PlacedOrder> | null;
  if (!placed || typeof placed.order_number !== 'string' || typeof placed.total !== 'number') {
    throw new OrderError('generic');
  }
  return { order_number: placed.order_number, total: placed.total, duplicate: Boolean(placed.duplicate) };
}
