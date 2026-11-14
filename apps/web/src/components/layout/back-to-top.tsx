'use client';

import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';

import { ArrowUpIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';
import { useAiWidget } from '@/stores/ai-widget';

/**
 * Round gold "scroll to top" button, fixed right above the NUSKA AI button.
 * It appears once the page is scrolled and hides while the AI chat is open.
 */
export function BackToTop() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const aiOpen = useAiWidget((state) => state.open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (pathname.startsWith(`/${locale}/admin`)) return null;
  const shown = visible && !aiOpen;
  return (
    <button
      type="button"
      aria-label={t.footer.backToTop}
      title={t.footer.backToTop}
      tabIndex={shown ? 0 : -1}
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
        })
      }
      className={cn(
        'fixed bottom-[4.9rem] right-[1.35rem] z-50 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-[#F3D896] to-[#D6AD62] text-[#27391F] shadow-[0_10px_24px_-8px_rgba(214,173,98,0.9)] transition duration-300 hover:-translate-y-1 sm:right-5',
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      )}
    >
      <ArrowUpIcon width={20} height={20} />
    </button>
  );
}
