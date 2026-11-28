'use client';

import { useState } from 'react';

import type { ProductCard } from '@nuska/types';
import Image from 'next/image';
import Link from 'next/link';

import { BISHKEK, KG_REGIONS, KG_VIEWBOX, type RegionId } from './kg-regions';

import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { EVERYWHERE, NO_REGION, PINNED, productsOfRegion, type OriginKey } from '@/lib/origin';
import { companyPhoto } from '@/lib/product-photos';

const DISH_PHOTOS: Partial<Record<OriginKey, string>> = { bal: '/images/dishes/bal.webp' };

function useProductLinks(products: ProductCard[]) {
  const { t, locale } = useI18n();
  return (key: OriginKey) => {
    const name = t.landing.productNames[key];
    const variants = products
      .filter((p) => p.slug === key || p.slug.startsWith(`${key}-`))
      .sort((a, b) => a.price.amount - b.price.amount);
    const product = variants[0];
    const price = product ? formatMoney(product.price, locale, t.common.som) : null;
    return {
      key,
      name,
      /** live catalog data for the popup; null when the product is not in the catalog */
      price: price && variants.length > 1 ? t.home.pricesFrom.replace('{price}', price) : price,
      size: product?.size ?? null,
      shelfLife: product?.shelfLife ?? null,
      image: product?.image?.url ?? null,
      href: product
        ? `/${locale}/product/${product.slug}`
        : `/${locale}/search?q=${encodeURIComponent(name)}`,
      photo: companyPhoto(key) ?? DISH_PHOTOS[key] ?? null,
    };
  };
}

function ProductChip({ item }: { item: ProductLink }) {
  return (
    <Link
      href={item.href}
      className="group inline-flex items-center gap-2 rounded-full border border-nk-beige bg-white py-1 pl-1 pr-3.5 text-sm text-nk-ink shadow-sm transition hover:-translate-y-0.5 hover:border-nk-gold hover:shadow-md"
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-nk-cream">
        {item.photo ? (
          <Image src={item.photo} alt="" fill sizes="32px" className="object-contain p-0.5" />
        ) : (
          <span className="font-serif text-sm text-nk-brown">{item.name.charAt(0)}</span>
        )}
      </span>
      {item.name}
    </Link>
  );
}

type ProductLink = ReturnType<ReturnType<typeof useProductLinks>>;

/**
 * Small window over a pin: the products of the region with photo, price,
 * weight / volume and shelf life (only what the catalog knows).
 */
function PinPopup({
  region,
  items,
  anchor,
}: {
  region: string;
  items: ProductLink[];
  anchor: [number, number];
}) {
  const { t } = useI18n();
  const [vw, vh] = KG_VIEWBOX.split(' ').slice(2).map(Number);
  const left = (anchor[0] / vw) * 100;
  const top = (anchor[1] / vh) * 100;
  // the window opens below the pin (only the lowest pins open it above), so the header never covers it
  const below = top < 75;
  return (
    <div
      className="pointer-events-auto absolute z-20 w-[min(17rem,80vw)]"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        // above or below the pin; kept inside the map near its edges
        transform: `translate(${left < 25 ? '-12%' : left > 75 ? '-88%' : '-50%'}, ${below ? '0.9rem' : 'calc(-100% - 2.4rem)'})`,
      }}
      role="tooltip"
    >
      <div className="rounded-2xl border border-nk-beige bg-white/95 p-3 text-left shadow-[0_24px_48px_-20px_rgba(60,40,15,0.55)] backdrop-blur motion-safe:animate-fade-up">
        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-nk-brown">
          {region}
        </p>
        <ul className="mt-2 space-y-1.5">
          {items.slice(0, 3).map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-nk-cream"
              >
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_50%_60%,#FFF8EA,#F0D9B0)]">
                  {(item.photo ?? item.image) && (
                    <Image
                      src={(item.photo ?? item.image)!}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-contain p-1"
                    />
                  )}
                </span>
                <span className="min-w-0 text-sm leading-snug">
                  <span className="block font-serif text-[15px] font-semibold text-nk-ink">
                    {item.name}
                  </span>
                  {(item.price || item.size) && (
                    <span className="block text-nk-ink">
                      {item.price && <span className="font-semibold">{item.price}</span>}
                      {item.price && item.size && <span className="text-nk-muted"> · </span>}
                      {item.size && <span className="text-nk-muted">{item.size}</span>}
                    </span>
                  )}
                  {item.shelfLife && (
                    <span className="block text-xs text-nk-muted">
                      {t.product.shelfLife}: {item.shelfLife}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Interactive map of Kyrgyzstan: hover or tap an oblast to see the products
 * traditionally made there (the company's own list). Regions are keyboard
 * accessible. `compact` is the home page version; the full one adds the
 * panel with the product lists.
 */
export function OriginMap({
  products,
  compact = false,
  className,
}: {
  products: ProductCard[];
  compact?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<RegionId>('naryn');
  const [hovered, setHovered] = useState<RegionId | null>(null);
  const link = useProductLinks(products);
  const [touched, setTouched] = useState(false);
  const shown = hovered ?? selected;
  const here = productsOfRegion(shown).map(link);
  const anchor = KG_REGIONS.find((region) => region.id === shown)?.anchor;
  const popup =
    touched && anchor && PINNED.has(shown) && here.length > 0 ? (
      <PinPopup region={t.landing.regions[shown]} items={here} anchor={anchor} />
    ) : null;

  const map = (
    <svg
      viewBox={KG_VIEWBOX}
      className="h-auto w-full max-w-full overflow-visible"
      role="group"
      aria-label={t.landing.originHint}
    >
      <defs>
        <linearGradient id="kg-land" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2E2BF" />
          <stop offset="1" stopColor="#E2C99B" />
        </linearGradient>
      </defs>
      {/* depth: the land is drawn twice, the lower copy darker */}
      <g transform="translate(0 9)" fill="#B9925B" opacity=".55" aria-hidden>
        {KG_REGIONS.map((region) => (
          <path key={region.id} d={region.path} />
        ))}
      </g>
      {KG_REGIONS.map((region) => {
        const active = region.id === shown;
        return (
          <path
            key={region.id}
            d={region.path}
            role="button"
            tabIndex={0}
            aria-label={t.landing.regions[region.id]}
            aria-pressed={region.id === selected}
            onMouseEnter={() => (setHovered(region.id), setTouched(true))}
            onFocus={() => (setHovered(region.id), setTouched(true))}
            onBlur={() => setHovered(null)}
            onClick={() => (setSelected(region.id), setTouched(true))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelected(region.id);
              }
            }}
            className={cn(
              'cursor-pointer outline-none transition-[fill,transform] duration-300',
              active ? 'fill-[#D7B675]' : 'fill-[url(#kg-land)] hover:fill-[#E9D19F]'
            )}
            stroke="#FFF9EC"
            strokeWidth={active ? 2.4 : 1.6}
            strokeLinejoin="round"
          />
        );
      })}
      {KG_REGIONS.filter((region) => PINNED.has(region.id)).map((region) => (
        <g
          key={region.id}
          transform={`translate(${region.anchor[0]} ${region.anchor[1]})`}
          className="pointer-events-none"
          aria-hidden
        >
          <g
            className={cn(
              'transition-transform duration-300',
              region.id === shown ? '-translate-y-2 scale-125' : ''
            )}
          >
            <path
              d="M0 0c-9-11-15-18-15-26a15 15 0 0 1 30 0c0 8-6 15-15 26Z"
              fill={region.id === shown ? '#B5531F' : '#D9822B'}
              stroke="#FFF6E2"
              strokeWidth="2"
            />
            <circle cx="0" cy="-26" r="5.5" fill="#FFF6E2" />
          </g>
        </g>
      ))}
      <g
        transform={`translate(${BISHKEK[0]} ${BISHKEK[1]})`}
        aria-hidden
        className="pointer-events-none"
      >
        <circle r="6" fill="#355B3E" stroke="#FFF6E2" strokeWidth="2" />
        <text x="10" y="4" className="fill-nk-forest text-[15px] font-semibold">
          Бишкек
        </text>
      </g>
    </svg>
  );

  if (compact)
    return (
      <div className={className}>
        {/* the region stays chosen while the pointer moves from it onto the popup */}
        <div className="relative" onMouseLeave={() => (setHovered(null), setTouched(false))}>
          {map}
          {popup}
        </div>
        <p className="mt-4 min-h-[2.5rem] text-center text-base text-nk-muted" aria-live="polite">
          <span className="font-semibold text-nk-ink">{t.landing.regions[shown]}</span>
          {here.length > 0 ? `: ${here.map((item) => item.name).join(', ')}` : ''}
        </p>
      </div>
    );

  return (
    <div
      className={cn(
        'grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]',
        className
      )}
    >
      <div>
        <div className="relative" onMouseLeave={() => (setHovered(null), setTouched(false))}>
          {map}
          {popup}
        </div>
        <p className="mt-3 text-center text-sm text-nk-muted">{t.landing.originHint}</p>
      </div>
      <div
        className="space-y-6 rounded-[2rem] border border-nk-beige bg-white/80 p-6 shadow-card backdrop-blur"
        aria-live="polite"
      >
        <div>
          <h2 className="font-serif text-2xl text-nk-ink">{t.landing.regions[shown]}</h2>
          <p className="mt-1 text-sm text-nk-muted">{t.landing.originHere}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {here.length > 0 ? (
              here.map((item) => <ProductChip key={item.key} item={item} />)
            ) : (
              <p className="text-sm text-nk-muted">{t.landing.originNone}</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-nk-ink">{t.landing.originEverywhere}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {EVERYWHERE.map(link).map((item) => (
              <ProductChip key={item.key} item={item} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-nk-ink">{t.landing.originNoRegion}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {NO_REGION.map(link).map((item) => (
              <ProductChip key={item.key} item={item} />
            ))}
          </div>
          <p className="mt-2 text-xs text-nk-muted">{t.landing.originApiary}</p>
        </div>
        <p className="border-t border-nk-beige pt-4 text-xs leading-relaxed text-nk-muted">
          {t.landing.originNote}
        </p>
      </div>
    </div>
  );
}
