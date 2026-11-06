'use client';

import { ChevronRightIcon } from '@/components/ui/icons';

export function BackToTop({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      }}
      className="group inline-flex items-center gap-2 rounded-full border border-cream/30 px-4 py-2 text-xs text-cream transition hover:bg-cream hover:text-brand"
    >
      <ChevronRightIcon
        width={14}
        height={14}
        className="-rotate-90 transition-transform group-hover:-translate-y-0.5"
      />
      {label}
    </button>
  );
}
