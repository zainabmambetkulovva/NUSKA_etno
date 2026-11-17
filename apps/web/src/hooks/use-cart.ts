'use client';

import { useEffect } from 'react';

import type { Cart, CartIssue, CartPreview, Money, ProductCard } from '@nuska/types';
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
  available: number | null;
  previousPrice: Money | null;
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

  // A guest cart lives in the browser; the server checks it against the catalog
  // (current prices, stock, products no longer sold).
  const guestItems = guest.items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    priceAmount: i.product.price.amount,
  }));
  const preview = useQuery({
    queryKey: ['cart-preview', locale, guestItems],
    queryFn: () =>
      api<CartPreview>('/cart/preview', { method: 'POST', locale, body: { items: guestItems } }),
    enabled: !signedIn && guestItems.length > 0,
  });
  // products that no longer exist leave the guest cart
  const missing = preview.data?.missing ?? [];
  useEffect(() => {
    missing.forEach((productId) => guest.remove(productId));
  }, [missing.join(',')]);

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

  const snapshotLines: CartLine[] = guest.items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    product: i.product,
    lineTotal: i.product.price.amount * i.quantity,
    issue: null,
    available: i.product.availableQuantity,
    previousPrice: null,
  }));
  const checked: Cart | undefined = signedIn ? server.data : preview.data;
  const lines: CartLine[] = signedIn
    ? (server.data?.items ?? [])
    : (preview.data?.items.filter((line) =>
        guest.items.some((i) => i.productId === line.productId)
      ) ?? snapshotLines);

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = checked
    ? checked.subtotal.amount
    : lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const needsFix = lines.some((line) => line.issue !== null || line.previousPrice !== null);

  /** Removes lines no longer sold, lowers quantities to the stock, accepts new prices. */
  const fix = useMutation({
    mutationFn: async () => {
      if (signedIn) return api<Cart>('/cart/fix', { method: 'POST', locale });
      for (const line of lines) {
        if (line.issue === 'UNAVAILABLE' || line.available === 0) guest.remove(line.productId);
        else {
          if (line.issue === 'INSUFFICIENT_STOCK' && line.available !== null)
            guest.setQuantity(line.productId, line.available);
          guest.refresh(line.product);
        }
      }
      return null;
    },
    onSuccess: (cart) => cart && setCart(cart),
  });

  return {
    signedIn,
    loading: me.isLoading || (signedIn && server.isLoading),
    lines,
    count,
    subtotal,
    canCheckout: checked ? checked.canCheckout : lines.length > 0,
    needsFix,
    blocked: lines.some((line) => line.issue !== null),
    priceChanged: lines.some((line) => line.previousPrice !== null),
    removedMissing: missing.length > 0,
    fix,
    add,
    setQuantity,
    remove,
  };
}
