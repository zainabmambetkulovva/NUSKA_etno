'use client';

import { useEffect, useRef, useState } from 'react';

import type { CategoryNode } from '@nuska/types';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CategoryIcon } from './category-icon';

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
 * "Catalog" item with a dropdown (design reference): category list with icons
 * and chevrons, gift sets, "Go to the catalog" and a product photo. Opens on
 * hover (short delay) or click; Escape closes it.
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
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      clearTimeout(timer.current);
      setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const later = (value: boolean, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(value), ms);
  };

  const items = [
    ...(categories.data ?? []).map((c) => ({
      key: c.id,
      href: `/${locale}/catalog/${c.slug}`,
      name: c.name,
      icon: c.slug,
    })),
    { key: 'gift', href: `/${locale}/gift-builder`, name: t.nav.giftSets, icon: 'gift' },
  ];

  return (
    <div
      className="relative"
      onMouseEnter={() => later(true, 120)}
      onMouseLeave={() => later(false, 180)}
    >
      <button
        type="button"
        onClick={() => {
          clearTimeout(timer.current);
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2.5 text-sm transition 2xl:gap-2 2xl:px-4 2xl:text-[15px]',
          active || open ? 'bg-beige/60 text-ink' : 'text-ink hover:text-brand'
        )}
      >
        {t.nav.catalog}
        <ChevronRightIcon
          width={15}
          height={15}
          className={cn('transition-transform', open ? '-rotate-90' : 'rotate-90')}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 top-full z-50 pt-3"
          >
            {/* Small arrow under the button */}
            <span
              className="absolute left-14 top-1 h-3 w-3 rotate-45 border-l border-t border-gold/40 bg-cream-light"
              aria-hidden
            />
            <div className="flex w-[620px] gap-3 rounded-2xl border border-gold/40 bg-cream-light p-3 shadow-lift">
              <div className="flex min-w-0 flex-1 flex-col">
                <ul className="flex-1">
                  {items.map((item) => (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        className="group flex items-center gap-4 rounded-xl px-3 py-2.5 text-[15px] text-ink transition hover:bg-beige/50"
                      >
                        <CategoryIcon slug={item.icon} className="shrink-0 text-brand" />
                        <span className="min-w-0 flex-1 truncate">{item.name}</span>
                        <ChevronRightIcon
                          width={16}
                          height={16}
                          className="shrink-0 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-brand"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/${locale}/catalog`}
                  className="mt-1 flex items-center gap-2 border-t border-gold/30 px-3 pb-1 pt-3 text-sm font-medium text-brand hover:underline"
                >
                  {t.nav.goToCatalog} <span aria-hidden>→</span>
                </Link>
              </div>
              <div className="relative w-[250px] shrink-0 overflow-hidden rounded-xl">
                <Image
                  src="/images/menu-products.webp"
                  alt=""
                  fill
                  sizes="250px"
                  className="object-cover"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
