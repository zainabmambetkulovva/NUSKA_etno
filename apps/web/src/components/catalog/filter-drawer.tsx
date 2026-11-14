'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { useSearchParams } from 'next/navigation';

import { CloseIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

/**
 * Catalog filters: a column beside the products on desktops, a panel sliding
 * in from the left on phones and tablets, so the products are on the first
 * screen. The filters are rendered once (one set of form fields).
 */
export function FilterDrawer({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  // a chosen filter changes the URL: close the panel to show the result
  useEffect(() => setOpen(false), [params]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="catalog-filters"
        className="mb-2 inline-flex items-center gap-2 rounded-full border border-nk-forest/30 bg-white px-5 py-2.5 text-sm font-semibold text-nk-forest shadow-sm lg:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        {t.catalog.filters}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-nk-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <div
        id="catalog-filters"
        className={cn(
          'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-[86%] max-lg:max-w-sm max-lg:overflow-y-auto max-lg:bg-nk-cream max-lg:p-5 max-lg:shadow-lift max-lg:transition-transform max-lg:duration-300',
          open ? 'max-lg:translate-x-0' : 'max-lg:invisible max-lg:-translate-x-full'
        )}
        role={open ? 'dialog' : undefined}
        aria-modal={open || undefined}
        aria-label={t.catalog.filters}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <p className="font-serif text-xl text-nk-ink">{t.catalog.filters}</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t.common.close}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
