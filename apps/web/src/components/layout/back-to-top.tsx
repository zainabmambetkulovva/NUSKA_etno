'use client';

import { ArrowUpIcon } from '@/components/ui/icons';

/** Round gold button that scrolls the page back to the top. */
export function BackToTop({ label, className }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
        })
      }
      className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-[#F3D896] to-[#D6AD62] text-[#27391F] shadow-[0_10px_24px_-10px_rgba(214,173,98,0.9)] transition hover:-translate-y-1 ${className ?? ''}`}
    >
      <ArrowUpIcon width={22} height={22} />
    </button>
  );
}
