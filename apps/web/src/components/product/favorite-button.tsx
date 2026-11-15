'use client';

import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
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
  // a small burst of hearts each time the product is added
  const [burst, setBurst] = useState(0);

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
        if (!active) setBurst((n) => n + 1);
        toggle.mutate({ productId, favorite: !active });
      }}
      className={cn(
        // placed buttons (absolute) already hold the heart burst; others need a box for it
        !className?.includes('absolute') && 'relative',
        'flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-soft backdrop-blur transition hover:scale-110',
        active ? 'text-danger' : 'text-ink-muted hover:text-danger',
        className
      )}
    >
      <span key={burst} className={cn('flex', burst > 0 && 'motion-safe:animate-pop')}>
        <HeartIcon filled={active} />
      </span>
      <AnimatePresence>
        {burst > 0 && (
          <motion.span
            key={burst}
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.55 }}
            aria-hidden
          >
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i / 6) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-danger"
                  initial={{ x: '-50%', y: '-50%', scale: 0.4 }}
                  animate={{
                    x: `calc(-50% + ${Math.cos(angle) * 18}px)`,
                    y: `calc(-50% + ${Math.sin(angle) * 18}px)`,
                    scale: [0.4, 1, 0.2],
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              );
            })}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
