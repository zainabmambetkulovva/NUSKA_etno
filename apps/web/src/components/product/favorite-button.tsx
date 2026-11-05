'use client';

import { useRouter } from 'next/navigation';

import { HeartIcon } from '@/components/ui/icons';
import { useMe } from '@/hooks/use-auth';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/use-favorites';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

/** Favorites belong to the account; guests are sent to the login page. */
export function FavoriteButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const me = useMe();
  const ids = useFavoriteIds();
  const toggle = useToggleFavorite();
  const active = ids.data?.has(productId) ?? false;

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? t.product.removeFromFavorites : t.product.addToFavorites}
      title={active ? t.product.removeFromFavorites : t.product.addToFavorites}
      onClick={(event) => {
        event.preventDefault();
        if (!me.data) {
          router.push(`/${locale}/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        toggle.mutate({ productId, favorite: !active });
      }}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-soft backdrop-blur transition hover:scale-110',
        active ? 'text-danger' : 'text-ink-muted hover:text-danger',
        className
      )}
    >
      <HeartIcon filled={active} />
    </button>
  );
}
