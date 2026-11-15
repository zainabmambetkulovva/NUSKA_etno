'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';

import type { ProductCard } from '@nuska/types';
import Link from 'next/link';

import { Tilt } from '@/components/motion/tilt';
import { AddToCartButton } from '@/components/product/add-to-cart-button';
import { FavoriteButton } from '@/components/product/favorite-button';
import { ProductImage } from '@/components/product/product-image';
import { ArrowLeftIcon, ArrowRightIcon, StarIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';

function BestsellerCard({ product }: { product: ProductCard }) {
  const { t, locale } = useI18n();
  const href = `/${locale}/product/${product.slug}`;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-white/70 bg-white/90 shadow-[0_18px_36px_-24px_rgba(80,60,30,0.55)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_44px_-24px_rgba(80,60,30,0.65)]">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        draggable={false}
        className="relative block bg-[radial-gradient(ellipse_at_50%_60%,#FFF8EA,#F3E4C8)]"
      >
        <ProductImage
          url={product.image?.url}
          slug={product.slug}
          alt={product.image?.alt}
          name={product.name}
          placeholderLabel={t.product.photoSoon}
          className="aspect-[5/4] [&_img]:object-contain [&_img]:p-3 [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105"
        />
      </Link>
      <StarIcon width={14} height={14} className="absolute left-3 top-3 text-nk-gold" aria-hidden />
      <FavoriteButton productId={product.id} className="absolute right-2.5 top-2.5 z-10" />
      <div className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3">
        <h3 className="text-[15px] font-semibold leading-snug text-nk-ink">
          <Link href={href} draggable={false} className="hover:text-nk-forest">
            {product.name}
          </Link>
        </h3>
        <p className="text-xs text-nk-muted">
          {product.size ?? ' '}
          <span
            className={cn(
              'ml-2 inline-flex items-center gap-1',
              product.inStock ? 'text-nk-forest' : 'text-danger'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                product.inStock ? 'bg-nk-forest' : 'bg-danger'
              )}
            />
            {product.inStock ? t.product.inStock : t.product.outOfStock}
          </span>
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-base font-bold text-nk-ink">
            {formatMoney(product.price, locale, t.common.som)}
          </span>
          <AddToCartButton
            product={product}
            size="sm"
            iconOnly
            className="h-10 w-10 shrink-0 rounded-full !p-0"
          />
        </div>
      </div>
    </article>
  );
}

/**
 * «Хиты продаж» of the mockup: live catalog products in a carousel that
 * scrolls with the mouse (drag), touch (native swipe), the wheel/trackpad and
 * the previous/next buttons; cards snap into place.
 */
export function Bestsellers({ products }: { products: ProductCard[] }) {
  const { t, locale } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8,
    });
  }, []);
  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update, products.length]);

  const page = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || !track.current) return;
    drag.current = { x: event.clientX, left: track.current.scrollLeft, moved: false };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const el = track.current;
    if (!state || !el) return;
    const dx = event.clientX - state.x;
    if (Math.abs(dx) > 4 && !state.moved) {
      state.moved = true;
      el.setPointerCapture(event.pointerId);
      el.style.scrollSnapType = 'none';
    }
    if (state.moved) el.scrollLeft = state.left - dx;
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const el = track.current;
    drag.current = null;
    if (!state?.moved || !el) return;
    el.releasePointerCapture(event.pointerId);
    el.style.scrollSnapType = '';
    // a drag must not open the card under the cursor
    const block = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('click', block, { capture: true, once: true });
    setTimeout(() => el.removeEventListener('click', block, { capture: true }), 0);
  };

  if (products.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-3xl text-nk-ink sm:text-[2.1rem]">
            <StarIcon width={20} height={20} className="text-nk-gold" aria-hidden />
            {t.landing.bestTitle}
          </h2>
          <p className="mt-1 text-sm text-nk-muted">{t.landing.bestText}</p>
        </div>
        <Link
          href={`/${locale}/catalog`}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-nk-forest underline-offset-4 hover:underline"
        >
          {t.landing.bestAll}
          <ArrowRightIcon width={16} height={16} className="transition group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="relative mt-5">
        <div
          ref={track}
          onScroll={update}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="region"
          aria-roledescription="carousel"
          aria-label={t.landing.bestTitle}
        >
          {products.map((product) => (
            <div
              key={product.id}
              data-card
              className="w-[68%] shrink-0 snap-start sm:w-[44%] md:w-[30%] lg:w-[calc((100%-48px)/4)]"
            >
              <Tilt className="group relative h-full rounded-[1.4rem]" max={6}>
                <BestsellerCard product={product} />
              </Tilt>
            </div>
          ))}
        </div>
        {[
          {
            dir: -1 as const,
            hidden: edges.start,
            label: t.landing.prev,
            Icon: ArrowLeftIcon,
            pos: '-left-4',
          },
          {
            dir: 1 as const,
            hidden: edges.end,
            label: t.landing.next,
            Icon: ArrowRightIcon,
            pos: '-right-4',
          },
        ].map(({ dir, hidden, label, Icon, pos }) => (
          <button
            key={dir}
            type="button"
            onClick={() => page(dir)}
            aria-label={label}
            disabled={hidden}
            className={cn(
              'absolute top-[38%] hidden h-11 w-11 items-center justify-center rounded-full border border-nk-beige bg-white text-nk-ink shadow-md transition hover:scale-105 hover:text-nk-forest disabled:pointer-events-none disabled:opacity-0 sm:flex',
              pos
            )}
          >
            <Icon width={18} height={18} />
          </button>
        ))}
      </div>
    </div>
  );
}
