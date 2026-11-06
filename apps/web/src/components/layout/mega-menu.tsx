'use client';

import { useEffect, useRef, useState } from 'react';

import type { CategoryNode } from '@nuska/types';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { KochkorMuyuz } from '@/components/brand/ornament';
import { ChevronRightIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/cn';

export function useCategories() {
  const { locale } = useI18n();
  return useQuery({
    queryKey: ['categories', locale],
    queryFn: () => api<CategoryNode[]>('/categories', { locale }),
    staleTime: 5 * 60_000,
  });
}

/**
 * "Catalog" item of the desktop navigation with a mega menu: categories with
 * image (or ornament), description and product count, plus a link to the whole
 * catalog. Opens on hover (with a short delay) or click; Escape closes it.
 */
export function CatalogMegaMenu({ active }: { active: boolean }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const categories = useCategories();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const later = (value: boolean, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(value), ms);
  };

  return (
    <div onMouseEnter={() => later(true, 120)} onMouseLeave={() => later(false, 180)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm transition',
          active || open
            ? 'bg-brand-50 font-medium text-brand-dark'
            : 'text-ink-muted hover:text-brand'
        )}
      >
        {t.nav.catalog}
        <ChevronRightIcon
          width={14}
          height={14}
          className={cn('transition-transform', open ? '-rotate-90' : 'rotate-90')}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-full border-b border-cream-dark/60 bg-milk shadow-lift"
          >
            <div className="container grid gap-4 py-6 md:grid-cols-3 xl:grid-cols-6">
              {(categories.data ?? []).map((category, i) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={`/${locale}/catalog/${category.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-cream-dark/50 bg-cream-light transition hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-brand">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <>
                          <div className="bg-ornament absolute inset-0 opacity-30" aria-hidden />
                          <KochkorMuyuz className="relative h-8 w-16 text-cream transition duration-500 group-hover:scale-110" />
                        </>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <span className="font-serif font-semibold group-hover:text-brand">
                        {category.name}
                      </span>
                      {category.description && (
                        <span className="line-clamp-2 text-xs text-ink-soft">
                          {category.description}
                        </span>
                      )}
                      <span className="mt-auto text-xs text-ink-soft">{category.productCount}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
              <div className="flex flex-col gap-3">
                <Link
                  href={`/${locale}/catalog`}
                  className="group flex flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-brand p-3 text-center text-cream-light transition hover:bg-brand-dark"
                >
                  <KochkorMuyuz className="h-5 w-10 text-cream" />
                  <span className="font-serif font-semibold">{t.nav.allCatalog}</span>
                </Link>
                <Link
                  href={`/${locale}/gift-builder`}
                  className="group flex flex-1 items-center justify-center gap-1 rounded-xl border border-brand/30 bg-cream-light p-3 text-center text-brand transition hover:bg-brand-50"
                >
                  <span className="font-serif text-sm font-semibold">{t.gift.nav}</span>
                  <ChevronRightIcon
                    width={16}
                    height={16}
                    className="transition group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
