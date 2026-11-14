'use client';

import type { Cart, GiftSetLine } from '@nuska/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useMe } from './use-auth';
import { cartKey } from './use-cart';

import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { useGuestCart } from '@/stores/guest-cart';

/**
 * Adds a whole set (gift builder or an NUSKA AI proposal) to the cart, always
 * as an explicit action of the customer. Guests: browser cart; signed-in
 * users: server cart (quantities capped by stock, skipped products reported).
 */
export function useAddSetToCart() {
  const { locale } = useI18n();
  const me = useMe();
  const queryClient = useQueryClient();
  const guestCart = useGuestCart();

  return useMutation({
    mutationFn: async (lines: GiftSetLine[]) => {
      if (!me.data) {
        for (const line of lines) guestCart.add(line.product, line.quantity);
        return { skipped: 0 };
      }
      const result = await api<{ cart: Cart; skipped: unknown[] }>('/cart/merge', {
        method: 'POST',
        locale,
        body: { items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })) },
      });
      queryClient.setQueryData(cartKey(locale), result.cart);
      return { skipped: result.skipped.length };
    },
  });
}
