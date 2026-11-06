'use client';

import { useRef } from 'react';

import type { PublicReview } from '@nuska/types';
import Link from 'next/link';

import { Stars } from './stars';

import { ChevronRightIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { formatDate } from '@/lib/format';

/** Real, moderated reviews in a swipeable row (scroll-snap) with arrow buttons. */
export function ReviewsSlider({ reviews }: { reviews: PublicReview[] }) {
  const { t, locale } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <div className="relative">
      <div
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:none]"
      >
        {reviews.map((review) => (
          <figure
            key={review.id}
            className="card flex w-[85%] shrink-0 snap-start flex-col gap-3 p-6 sm:w-[46%] lg:w-[31.5%]"
          >
            <Stars value={review.rating} />
            {review.comment && <blockquote className="text-ink">“{review.comment}”</blockquote>}
            <figcaption className="mt-auto text-sm text-ink-soft">
              {review.author} · {formatDate(review.createdAt, locale)}
              {review.product && (
                <>
                  {' · '}
                  <Link
                    href={`/${locale}/product/${review.product.slug}`}
                    className="text-brand hover:underline"
                  >
                    {review.product.name}
                  </Link>
                </>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
      {reviews.length > 3 && (
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-dark hover:border-brand hover:text-brand"
            aria-label={t.common.prev}
          >
            <ChevronRightIcon className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-dark hover:border-brand hover:text-brand"
            aria-label={t.common.next}
          >
            <ChevronRightIcon />
          </button>
        </div>
      )}
    </div>
  );
}
