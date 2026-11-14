'use client';

import type { ProductCard as ProductCardData } from '@nuska/types';
import { useQuery } from '@tanstack/react-query';

import { OrnamentLoader } from '@/components/brand/ornament';
import { ProductCard } from '@/components/product/product-card';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';

export default function FavoritesPage() {
  const { t, locale } = useI18n();
  const favorites = useQuery({
    queryKey: ['favorites', 'list', locale],
    queryFn: () => api<{ addedAt: string; product: ProductCardData }[]>('/favorites', { locale }),
  });
  if (favorites.isLoading) return <OrnamentLoader label={t.common.loading} />;
  if (!favorites.data?.length)
    return (
      <EmptyState
        title={t.account.favoritesEmpty}
        action={<ButtonLink href={`/${locale}/catalog`}>{t.cart.toCatalog}</ButtonLink>}
      />
    );
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {favorites.data.map(({ product }) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
