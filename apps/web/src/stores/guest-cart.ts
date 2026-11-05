import type { ProductCard } from '@nuska/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const MAX_ITEM_QUANTITY = 99;

export interface GuestCartItem {
  productId: string;
  quantity: number;
  /** Snapshot for display only; prices are re-checked by the server at checkout. */
  product: ProductCard;
}

interface GuestCartState {
  items: GuestCartItem[];
  add: (product: ProductCard, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const cap = (product: ProductCard, quantity: number) =>
  Math.max(
    1,
    Math.min(quantity, MAX_ITEM_QUANTITY, product.availableQuantity ?? MAX_ITEM_QUANTITY)
  );

/** Cart of a visitor who is not signed in, kept in localStorage and merged into the account on login. */
export const useGuestCart = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, quantity) => {
        const existing = get().items.find((i) => i.productId === product.id);
        const items = existing
          ? get().items.map((i) =>
              i.productId === product.id
                ? { ...i, product, quantity: cap(product, i.quantity + quantity) }
                : i
            )
          : [...get().items, { productId: product.id, product, quantity: cap(product, quantity) }];
        set({ items });
      },
      setQuantity: (productId, quantity) =>
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity: cap(i.product, quantity) } : i
          ),
        }),
      remove: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      clear: () => set({ items: [] }),
    }),
    { name: 'nuska-guest-cart', version: 1, storage: createJSONStorage(() => localStorage) }
  )
);
