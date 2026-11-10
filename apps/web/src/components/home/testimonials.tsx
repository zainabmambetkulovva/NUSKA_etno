'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Testimonial } from '@nuska/types';
import { motion, useReducedMotion } from 'framer-motion';

import { Stars } from './stars';

import { LogoMark } from '@/components/brand/logo';
import { InstagramIcon } from '@/components/layout/social-icons';
import { ChevronRightIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

const TINTS = [
  'from-[#F4D58B] to-[#C98F3A]',
  'from-[#E8D9B8] to-[#BFA071]',
  'from-[#F7E3A1] to-[#E2B95A]',
  'from-[#F2F0E6] to-[#CFC6AA]',
  'from-[#E6C79A] to-[#B07A45]',
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** One testimonial: avatar, name, stars, text, photo, date, Instagram link. */
export function TestimonialCard({
  item,
  index,
  active = false,
}: {
  item: Testimonial;
  index: number;
  active?: boolean;
}) {
  const { t, locale } = useI18n();
  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-[#FAF8EF] text-[#243D2B] transition-shadow duration-500',
        active
          ? 'shadow-[0_0_0_1px_rgba(214,173,98,0.8),0_30px_60px_-20px_rgba(0,0,0,0.6),0_0_60px_-10px_rgba(214,173,98,0.55)]'
          : 'shadow-[0_24px_48px_-24px_rgba(0,0,0,0.6)]'
      )}
    >
      <div
        className={cn(
          'relative aspect-[16/9] overflow-hidden bg-gradient-to-br',
          TINTS[index % TINTS.length]
        )}
      >
        {item.photoUrl ? (
          <img
            src={item.photoUrl}
            alt={item.productName ?? ''}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <LogoMark className="h-16 w-16 opacity-70" />
          </span>
        )}
        {item.productName && (
          <span className="absolute bottom-3 left-3 rounded-full bg-[#243D2B]/85 px-3 py-1 text-xs font-semibold text-[#F4E9B9] backdrop-blur">
            {item.productName}
          </span>
        )}
        {item.isDemo && (
          <span className="absolute right-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[#243D2B]">
            {t.home.reviewsSample}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          {item.avatarUrl ? (
            <img
              src={item.avatarUrl}
              alt=""
              className="h-12 w-12 rounded-full object-cover ring-2 ring-[#D6AD62]"
            />
          ) : (
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#355B3E] font-serif text-lg text-[#F4E9B9] ring-2 ring-[#D6AD62] ring-offset-2 ring-offset-[#FAF8EF]"
              aria-hidden
            >
              {initials(item.authorName)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{item.authorName}</p>
            <Stars value={item.rating} />
          </div>
          {item.instagramUrl && (
            <a
              href={item.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram: ${item.authorName}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D6AD62]/60 text-[#B07A35] transition hover:bg-[#D6AD62] hover:text-white [&_svg]:h-4 [&_svg]:w-4"
            >
              <InstagramIcon />
            </a>
          )}
        </div>
        <blockquote className="flex-1 text-[15px] leading-relaxed">«{item.text}»</blockquote>
        <p className="text-xs text-[#243D2B]/60">{formatDate(item.reviewDate, locale)}</p>
      </div>
    </article>
  );
}

/**
 * Endless carousel: the centre card is the largest with a gold glow, the
 * neighbours are smaller and turned in perspective, the outer ones peek in.
 * It moves by itself, pauses on hover/focus, has arrows and swipe.
 */
export function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [wide, setWide] = useState(true);
  const n = items.length;
  const go = useCallback((step: number) => setIndex((i) => (i + step + n) % n), [n]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (paused || reduce || n < 2) return;
    const timer = setInterval(() => go(1), 5000);
    return () => clearInterval(timer);
  }, [paused, reduce, go, n]);

  if (n === 0) return null;
  const spacing = wide ? 330 : 270;
  const range = wide ? 2 : 1;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <motion.div
        className="relative mx-auto h-[500px] touch-pan-y [perspective:1400px]"
        drag={n > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) go(1);
          else if (info.offset.x > 60) go(-1);
        }}
        aria-roledescription="carousel"
        aria-label={t.home.reviewsTitle}
      >
        {items.map((item, i) => {
          let pos = i - index;
          if (pos > n / 2) pos -= n;
          if (pos < -n / 2) pos += n;
          const hidden = Math.abs(pos) > range;
          return (
            <motion.div
              key={item.id}
              className="absolute left-1/2 top-4 w-[260px] sm:w-[320px]"
              style={{ marginLeft: wide ? -160 : -130, zIndex: 10 - Math.abs(pos) }}
              initial={false}
              animate={{
                x: pos * spacing,
                scale: pos === 0 ? 1.06 : Math.abs(pos) === 1 ? 0.88 : 0.76,
                rotateY: pos * -14,
                opacity: hidden ? 0 : Math.abs(pos) === 2 ? 0.45 : 1,
                y: pos === 0 ? 0 : 18,
              }}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
              aria-hidden={pos !== 0}
              whileHover={pos === 0 && !reduce ? { y: -8 } : undefined}
              onClick={() => pos !== 0 && go(pos)}
            >
              <TestimonialCard item={item} index={i} active={pos === 0} />
            </motion.div>
          );
        })}
      </motion.div>
      {n > 1 && (
        <div className="mt-2 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => go(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D6AD62]/60 text-[#F4E9B9] transition hover:bg-[#D6AD62] hover:text-[#243D2B]"
            aria-label={t.common.prev}
          >
            <ChevronRightIcon className="rotate-180" />
          </button>
          <div className="flex gap-2">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1} / ${n}`}
                aria-current={i === index}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === index ? 'w-7 bg-[#D6AD62]' : 'w-2 bg-[#F4E9B9]/40 hover:bg-[#F4E9B9]/70'
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D6AD62]/60 text-[#F4E9B9] transition hover:bg-[#D6AD62] hover:text-[#243D2B]"
            aria-label={t.common.next}
          >
            <ChevronRightIcon />
          </button>
        </div>
      )}
    </div>
  );
}
