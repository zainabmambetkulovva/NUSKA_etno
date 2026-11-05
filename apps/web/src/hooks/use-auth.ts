'use client';

import type { User } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { useGuestCart } from '@/stores/guest-cart';

export const meKey = ['me'] as const;

/** Current user, or null for guests. */
export function useMe() {
  return useQuery({
    queryKey: meKey,
    // Always 200: { user } or { user: null }; renews an expired access token server-side.
    queryFn: async () => (await api<{ user: User | null }>('/auth/session')).user,
    staleTime: 60_000,
  });
}

/** After sign-in: move the guest cart into the account cart. */
function useAfterSignIn() {
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  return async (user: User) => {
    queryClient.setQueryData(meKey, user);
    const guest = useGuestCart.getState();
    if (guest.items.length > 0) {
      try {
        await api('/cart/merge', {
          method: 'POST',
          locale,
          body: {
            items: guest.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          },
        });
        guest.clear();
      } catch {
        // Keep the guest cart if merging failed; the user can retry from the cart page.
      }
    }
    await queryClient.invalidateQueries();
  };
}

export function useLogin() {
  const afterSignIn = useAfterSignIn();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<{ user: User }>('/auth/login', { method: 'POST', body }),
    onSuccess: ({ user }) => afterSignIn(user),
  });
}

export function useRegister() {
  const afterSignIn = useAfterSignIn();
  const { locale } = useI18n();
  return useMutation({
    mutationFn: (body: {
      email: string;
      password: string;
      firstName: string;
      lastName?: string;
      phone?: string;
    }) => api<{ user: User }>('/auth/register', { method: 'POST', body: { ...body, locale } }),
    onSuccess: ({ user }) => afterSignIn(user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      queryClient.setQueryData(meKey, null);
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
    },
  });
}
