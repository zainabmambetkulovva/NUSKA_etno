'use client';

import type { Cart, CartIssue, ProductCard } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useMe } from './use-auth';

import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { useGuestCart } from '@/stores/guest-cart';

export const cartKey = (locale: string) => ['cart', locale] as const;

export interface CartLine {
  productId: string;
  quantity: number;
  product: ProductCard;
  lineTotal: number;
  issue: CartIssue;
}

/**
 * One cart interface for guests (localStorage) and signed-in users (server cart).
 */
export function useCart() {
  const { locale } = useI18n();
  const me = useMe();
  const queryClient = useQueryClient();
  const guest = useGuestCart();
  const signedIn = Boolean(me.data);

  const server = useQuery({
    queryKey: cartKey(locale),
    queryFn: () => api<Cart>('/cart', { locale }),
    enabled: signedIn,
  });

  const setCart = (cart: Cart) => queryClient.setQueryData(cartKey(locale), cart);

  const add = useMutation({
    mutationFn: async ({ product, quantity }: { product: ProductCard; quantity: number }) => {
      if (!signedIn) {
        guest.add(product, quantity);
        return null;
      }
      return api<Cart>('/cart/items', {
        method: 'POST',
        locale,
        body: { productId: product.id, quantity },
      });
    },
    onSuccess: (cart) => cart && setCart(cart),
  });

  const setQuantity = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      if (!signedIn) {
        guest.setQuantity(productId, quantity);
        return null;
      }
      return api<Cart>(`/cart/items/${productId}`, { method: 'PATCH', locale, body: { quantity } });
    },
    onSuccess: (cart) => cart && setCart(cart),
  });

  const remove = useMutation({
    mutationFn: async (productId: string) => {
      if (!signedIn) {
        guest.remove(productId);
        return null;
      }
      return api<Cart>(`/cart/items/${productId}`, { method: 'DELETE', locale });
    },
    onSuccess: (cart) => cart && setCart(cart),
  });

  const lines: CartLine[] = signedIn
    ? (server.data?.items ?? [])
    : guest.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        product: i.product,
        lineTotal: i.product.price.amount * i.quantity,
        issue: null,
      }));

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = signedIn
    ? (server.data?.subtotal.amount ?? 0)
    : lines.reduce((sum, line) => sum + line.lineTotal, 0);

  return {
    signedIn,
    loading: me.isLoading || (signedIn && server.isLoading),
    lines,
    count,
    subtotal,
    canCheckout: signedIn ? Boolean(server.data?.canCheckout) : lines.length > 0,
    add,
    setQuantity,
    remove,
  };
}
