'use client';

import { Children, useEffect, useRef, useState, type ReactNode } from 'react';

import { ChevronRightIcon } from './icons';

import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

/**
 * Horizontal carousel: swipe / scroll with snap points, arrow buttons, and a
 * gentle auto-advance that stops on hover, focus or touch (and with
 * prefers-reduced-motion). After the last card it returns to the first.
 */
export function Carousel({
  children,
  itemClassName = 'w-[78%] sm:w-[46%] lg:w-[31.5%] xl:w-[23.5%]',
  autoPlay = 5000,
  label,
}: {
  children: ReactNode;
  itemClassName?: string;
  autoPlay?: number | false;
  label?: string;
}) {
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const items = Children.toArray(children);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const width = (first?.offsetWidth ?? el.clientWidth) + 20;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: 'smooth' });
    else el.scrollBy({ left: dir * width, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!autoPlay || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    const id = setInterval(() => step(1), autoPlay);
    return () => clearInterval(id);
  }, [autoPlay, paused]);

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onTouchStart={() => setPaused(true)}
    >
      <div
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div key={i} className={cn('shrink-0 snap-start', itemClassName)}>
            {item}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 bg-milk text-brand transition hover:bg-brand hover:text-cream-light"
          aria-label={t.common.prev}
        >
          <ChevronRightIcon className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 bg-milk text-brand transition hover:bg-brand hover:text-cream-light"
          aria-label={t.common.next}
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
