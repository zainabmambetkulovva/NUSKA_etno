import Image from 'next/image';
import Link from 'next/link';

import { Branch, Cloud, Eagle } from '@/components/brand/nature-decor';
import { ArrowRightIcon, LeafIcon, PlayIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';

/** Part of the hero picture shown from the bottom; the logo painted in its sky stays above. */
const VISIBLE = 0.62;
const RATIO = 1672 / 941;

/** Wooden stump with a red felt carpet, the podium of the product composition. */
function Stump({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 150" className={className} aria-hidden>
      <defs>
        <radialGradient id="stump-top" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#E7C08A" />
          <stop offset="0.65" stopColor="#C9955C" />
          <stop offset="1" stopColor="#9C6A3B" />
        </radialGradient>
        <linearGradient id="stump-side" x1="0" x2="1">
          <stop offset="0" stopColor="#5E3B22" />
          <stop offset="0.45" stopColor="#8C5D36" />
          <stop offset="1" stopColor="#4E301B" />
        </linearGradient>
        <pattern id="felt" width="28" height="22" patternUnits="userSpaceOnUse">
          <path
            d="M14 4c-4 0-6 3-6 5s2 4 4 4 3-2 2-3M14 4c4 0 6 3 6 5s-2 4-4 4-3-2-2-3M4 18h20"
            fill="none"
            stroke="#E9C77F"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </pattern>
      </defs>
      <ellipse cx="180" cy="128" rx="170" ry="20" fill="rgba(60,40,20,0.28)" />
      <path d="M22 44v62c0 20 71 36 158 36s158-16 158-36V44Z" fill="url(#stump-side)" />
      <path
        d="M22 70c40 22 92 30 158 30s118-8 158-30v36c0 20-71 36-158 36S22 126 22 106Z"
        fill="#9B2A24"
      />
      <path
        d="M22 70c40 22 92 30 158 30s118-8 158-30v36c0 20-71 36-158 36S22 126 22 106Z"
        fill="url(#felt)"
        opacity=".75"
      />
      <path
        d="M22 72c40 22 92 30 158 30s118-8 158-30"
        stroke="#E9C77F"
        strokeWidth="2"
        fill="none"
      />
      <ellipse cx="180" cy="44" rx="158" ry="34" fill="url(#stump-top)" />
      <g fill="none" stroke="#9E6B3A" strokeOpacity=".45">
        <ellipse cx="180" cy="44" rx="120" ry="25" />
        <ellipse cx="180" cy="44" rx="86" ry="18" />
        <ellipse cx="180" cy="44" rx="52" ry="11" />
        <ellipse cx="180" cy="44" rx="20" ry="4.5" />
      </g>
    </svg>
  );
}

const PRODUCTS = [
  {
    src: '/images/products/zhupka.png',
    w: 480,
    h: 733,
    left: 4,
    bottom: 46,
    height: 62,
    z: 1,
    rotate: 0,
  },
  {
    src: '/images/products/keremet-shypaa.png',
    w: 681,
    h: 1263,
    left: 30,
    bottom: 48,
    height: 86,
    z: 1,
    rotate: -19.6,
  },
  {
    src: '/images/products/sary-mai.png',
    w: 825,
    h: 1148,
    left: 50,
    bottom: 40,
    height: 58,
    z: 2,
    rotate: 0,
  },
  {
    src: '/images/products/navat.png',
    w: 723,
    h: 566,
    left: 70,
    bottom: 38,
    height: 36,
    z: 3,
    rotate: 0,
  },
] as const;

/** The company's packages standing on the stump (photos as sent, transparent background). */
function ProductComposition({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="relative h-full w-full">
        <Stump className="absolute inset-x-0 bottom-0 w-full" />
        {PRODUCTS.map((product) => (
          <div
            key={product.src}
            className="absolute"
            style={{
              left: `${product.left}%`,
              bottom: `${product.bottom}%`,
              height: `${product.height}%`,
              aspectRatio: `${product.w} / ${product.h}`,
              zIndex: product.z,
            }}
          >
            <Image
              src={product.src}
              alt=""
              width={product.w}
              height={product.h}
              quality={95}
              sizes="220px"
              className="h-full w-full object-contain drop-shadow-[0_14px_14px_rgba(50,30,10,0.35)]"
              style={product.rotate ? { transform: `rotate(${product.rotate}deg)` } : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * First screen of the mockup: on the left the badge, «Природная сила
 * Кыргызстана», the subtitle and two buttons on the warm cream sky; on the
 * right the company's picture of the valley (yurt, horses, dairy products on
 * wood) with the packages on a wooden stump, drifting clouds and an eagle.
 * The picture file is shown untouched (unoptimized); only its lower part is in
 * view, so the logo painted in its sky stays out of the frame.
 */
export function Hero({
  locale,
  t,
  videoUrl,
}: {
  locale: Locale;
  t: Dictionary;
  videoUrl: string | null;
}) {
  const imageWidth = `max(100%, calc(var(--hero-h) / ${VISIBLE} * ${RATIO.toFixed(4)}))`;
  const more = videoUrl
    ? { href: videoUrl, target: '_blank', rel: 'noopener noreferrer' }
    : { href: `/${locale}#brand` };

  return (
    <section
      className="relative -mt-[68px] flex flex-col overflow-hidden bg-nk-cream lg:block [--hero-h:300px] lg:-mt-[80px] lg:h-[var(--hero-h)] lg:[--hero-h:max(620px,40vw)]"
      aria-labelledby="hero-title"
    >
      {/* warm sky */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_10%,#FFF6E6_0%,#F7E8CF_45%,#F1DDBF_100%)]"
        aria-hidden
      />

      {/* the picture: a band under the text on phones, the right side on desktop */}
      <div className="relative order-2 h-[var(--hero-h)] overflow-hidden lg:absolute lg:inset-0 lg:h-auto">
        <Image
          src="/images/home/hero.png"
          alt={t.home.heroImageAlt}
          width={1672}
          height={941}
          priority
          unoptimized
          className="absolute bottom-0 right-0 h-auto max-w-none"
          style={{ width: imageWidth }}
        />
        {/* melts into the cream sky on the left and at the top */}
        <div
          className="absolute inset-0 hidden bg-[linear-gradient(to_right,#F7E9D1_0%,rgba(247,233,209,0.92)_18%,rgba(247,233,209,0.55)_32%,rgba(247,233,209,0.12)_46%,transparent_56%)] lg:block"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#F7E9D1] to-transparent lg:h-40"
          aria-hidden
        />
        <ProductComposition className="absolute bottom-[9%] left-[52%] hidden aspect-[360/300] w-[clamp(250px,22vw,380px)] lg:block" />
        <div
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-nk-cream to-transparent lg:h-24"
          aria-hidden
        />
      </div>

      <Cloud className="left-[34%] top-[16%] hidden h-16 w-60 [--drift:60px] lg:block" />
      <Cloud
        className="right-[6%] top-[26%] hidden h-14 w-52 [--drift:-50px] [--drift-duration:32s] lg:block"
        style={{ animationDelay: '-8s' }}
      />
      <Eagle className="right-[30%] top-[18%] hidden h-12 w-28 lg:block" />
      <Branch className="-left-6 top-20 hidden xl:block" />

      <div className="container relative z-10 order-1 pb-10 pt-[100px] lg:flex lg:h-full lg:items-center lg:pb-16 lg:pt-[80px]">
        <div className="max-w-[640px] motion-safe:animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-1.5 text-xs font-medium text-nk-ink shadow-sm backdrop-blur">
            <LeafIcon width={16} height={16} className="text-nk-forest" />
            {t.home.heroBadge}
          </p>
          <h1
            id="hero-title"
            className="mt-5 font-serif text-[clamp(2.4rem,4.3vw,4.3rem)] font-semibold leading-[1.02] tracking-tight text-nk-ink"
          >
            {t.home.heroTitle}
          </h1>
          <p className="mt-5 max-w-[30rem] text-base leading-relaxed text-nk-ink/85 sm:text-lg">
            {t.home.heroText}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href={`/${locale}/catalog`} className="btn-forest group">
              {t.nav.goToCatalog}
              <ArrowRightIcon
                width={18}
                height={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <a
              {...more}
              className="group inline-flex items-center gap-3 text-sm font-medium text-nk-ink"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-nk-forest shadow-[0_10px_24px_-12px_rgba(43,42,34,0.6)] transition group-hover:scale-105">
                <PlayIcon width={18} height={18} />
              </span>
              {t.home.heroMore}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
