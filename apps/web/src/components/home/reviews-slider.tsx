'use client';

import { useRef } from 'react';

import type { PublicReview } from '@nuska/types';
import Link from 'next/link';

import { Stars } from './stars';

import { ChevronRightIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { formatDate } from '@/lib/format';

/** Real, moderated reviews in a swipeable row (scroll-snap) with round arrows on the sides. */
export function ReviewsSlider({ reviews }: { reviews: (PublicReview & { initials: string })[] }) {
  const { t, locale } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });

  const arrow =
    'absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-[0_8px_20px_-8px_rgba(60,40,20,0.5)] transition hover:bg-forest hover:text-cream-light md:flex';

  return (
    <div className="relative md:px-14">
      <div
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 pt-1 [scrollbar-width:none] md:mx-0 md:px-1"
      >
        {reviews.map((review) => (
          <figure
            key={review.id}
            className="flex w-[85%] shrink-0 snap-start gap-4 rounded-[1.6rem] bg-sand-light p-5 shadow-[0_14px_30px_-18px_rgba(90,60,25,0.5)] ring-1 ring-honey/25 sm:w-[46%] lg:w-[calc((100%-2.5rem)/3)]"
          >
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forest-light to-forest font-serif text-xl text-honey-light ring-2 ring-honey/60 ring-offset-2 ring-offset-sand-light"
              aria-hidden
            >
              {review.initials}
            </span>
            <div className="flex min-w-0 flex-col gap-2">
              <Stars value={review.rating} />
              {review.comment && (
                <blockquote className="line-clamp-4 text-sm leading-relaxed text-ink">
                  “{review.comment}”
                </blockquote>
              )}
              <figcaption className="mt-auto text-xs text-ink-soft">
                <span className="font-semibold text-ink">{review.author}</span> ·{' '}
                {formatDate(review.createdAt, locale)}
                {review.product && (
                  <>
                    {' · '}
                    <Link
                      href={`/${locale}/product/${review.product.slug}`}
                      className="text-forest hover:underline"
                    >
                      {review.product.name}
                    </Link>
                  </>
                )}
              </figcaption>
            </div>
          </figure>
        ))}
      </div>
      {reviews.length > 3 && (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            className={`${arrow} left-0`}
            aria-label={t.common.prev}
          >
            <ChevronRightIcon className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className={`${arrow} right-0`}
            aria-label={t.common.next}
          >
            <ChevronRightIcon />
          </button>
        </>
      )}
    </div>
  );
}
