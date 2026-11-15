import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MAX_ITEM_QUANTITY } from './guest-cart';

export interface GiftDraftItem {
  productId: string;
  quantity: number;
}

export interface LocalGiftSet {
  id: string;
  name: string;
  items: GiftDraftItem[];
  createdAt: string;
}

export const MAX_SET_LINES = 30;

interface GiftSetState {
  /** The set being built (only product ids and quantities; prices come from the server). */
  items: GiftDraftItem[];
  /** Sets saved by a visitor who is not signed in (this browser only). */
  saved: LocalGiftSet[];
  set: (productId: string, quantity: number) => void;
  load: (items: GiftDraftItem[]) => void;
  clear: () => void;
  saveLocal: (name: string) => void;
  removeLocal: (id: string) => void;
}

export const useGiftSet = create<GiftSetState>()(
  persist(
    (set, get) => ({
      items: [],
      saved: [],
      set: (productId, quantity) => {
        const q = Math.min(Math.max(0, Math.round(quantity)), MAX_ITEM_QUANTITY);
        const others = get().items.filter((i) => i.productId !== productId);
        const exists = get().items.some((i) => i.productId === productId);
        if (q === 0) return set({ items: others });
        if (!exists && get().items.length >= MAX_SET_LINES) return;
        set({
          items: exists
            ? get().items.map((i) => (i.productId === productId ? { ...i, quantity: q } : i))
            : [...get().items, { productId, quantity: q }],
        });
      },
      load: (items) => set({ items: items.slice(0, MAX_SET_LINES) }),
      clear: () => set({ items: [] }),
      saveLocal: (name) =>
        set({
          saved: [
            {
              id: `${Date.now()}`,
              name,
              items: get().items,
              createdAt: new Date().toISOString(),
            },
            ...get().saved,
          ].slice(0, 20),
        }),
      removeLocal: (id) => set({ saved: get().saved.filter((s) => s.id !== id) }),
    }),
    { name: 'nuska.gift-set', storage: createJSONStorage(() => localStorage) }
  )
);
