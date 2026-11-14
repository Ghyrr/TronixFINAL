import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface CartLine {
  productId: string;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  addItem: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  replaceLines: (lines: CartLine[]) => void;
}

const STORAGE_KEY = 'tronix-cart';
const MAX_QUANTITY = 99;

const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        typeof line === 'object' &&
        line !== null &&
        typeof (line as CartLine).productId === 'string' &&
        Number.isInteger((line as CartLine).quantity) &&
        (line as CartLine).quantity > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readCart);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const addItem = useCallback((productId: string, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (existing) {
        return current.map((line) =>
          line.productId === productId ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + quantity) } : line,
        );
      }
      return [...current, { productId, quantity: Math.min(MAX_QUANTITY, quantity) }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const next = Math.max(1, Math.min(MAX_QUANTITY, Math.floor(quantity)));
    setLines((current) => current.map((line) => (line.productId === productId ? { ...line, quantity: next } : line)));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const replaceLines = useCallback((next: CartLine[]) => setLines(next), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      clear,
      replaceLines,
    }),
    [lines, addItem, setQuantity, removeItem, clear, replaceLines],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
