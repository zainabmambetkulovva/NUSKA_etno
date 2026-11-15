'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useMe } from './use-auth';

import { api } from '@/lib/api/client';

const idsKey = ['favorites', 'ids'] as const;

export function useFavoriteIds() {
  const me = useMe();
  return useQuery({
    queryKey: idsKey,
    queryFn: () => api<string[]>('/favorites/ids'),
    enabled: Boolean(me.data),
    select: (ids) => new Set(ids),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, favorite }: { productId: string; favorite: boolean }) =>
      api(`/favorites/${productId}`, { method: favorite ? 'PUT' : 'DELETE' }),
    onMutate: async ({ productId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: idsKey });
      const previous = queryClient.getQueryData<string[]>(idsKey);
      queryClient.setQueryData<string[]>(idsKey, (ids = []) =>
        favorite ? [...new Set([...ids, productId])] : ids.filter((id) => id !== productId)
      );
      return { previous };
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(idsKey, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });
}
