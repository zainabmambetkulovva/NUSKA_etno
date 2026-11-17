import Image from 'next/image';
import Link from 'next/link';

import { HeroAtmosphereSlot, HeroLayer, HeroStage } from './hero-stage';

import { Branch, Cloud, Eagle } from '@/components/brand/nature-decor';
import { Magnetic } from '@/components/motion/magnetic';
import { TextReveal } from '@/components/motion/text-reveal';
import { ArrowRightIcon, LeafIcon, PlayIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';

/** Part of the hero picture shown from the bottom; the logo painted in its sky stays above. */
const VISIBLE = 0.62;
const RATIO = 1672 / 941;

/**
 * The packages on the wooden stump (public/images/home/stump-wood.webp, drawn
 * in code by scripts/podium), each on its own spot so none covers another:
 * jupka left, keremet shypaa at the back, sary mai right, the navat bowl at
 * the front. Positions are % of the 360 × 300 composition box (the stand
 * points printed by `render.cjs` with the stump scene).
 */
const PRODUCTS = [
  {
    src: '/images/products/zhupka.png',
    w: 480,
    h: 733,
    left: 19.2,
    bottom: 33.7,
    height: 34,
    z: 1,
    rotate: 0,
  },
  {
    src: '/images/products/keremet-shypaa.png',
    w: 681,
    h: 1263,
    left: 39.7,
    bottom: 38.6,
    height: 46,
    z: 1,
    rotate: -19.6,
  },
  {
    src: '/images/products/sary-mai.png',
    w: 825,
    h: 1148,
    left: 62.8,
    bottom: 33.7,
    height: 29,
    z: 1,
    rotate: 0,
  },
  {
    src: '/images/products/navat.png',
    w: 723,
    h: 566,
    left: 43.9,
    bottom: 27.4,
    height: 11.5,
    z: 3,
    rotate: 0,
  },
] as const;

/** The company's packages standing on the stump (photos as sent, transparent background). */
function ProductComposition({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="relative h-full w-full">
        <Image
          src="/images/home/stump-wood.webp"
          alt=""
          fill
          unoptimized
          className="object-contain"
        />
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
    <HeroStage
      labelledBy="hero-title"
      className="relative -mt-[68px] flex flex-col overflow-hidden bg-nk-cream [--hero-h:300px] lg:-mt-[80px] lg:block lg:h-[var(--hero-h)] lg:[--hero-h:max(620px,40vw)]"
    >
      {/* warm sky */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_10%,#FFF6E6_0%,#F7E8CF_45%,#F1DDBF_100%)]"
        aria-hidden
      />

      {/* phones and tablets: the picture as a rounded card under the text, with the packages */}
      <div className="container relative order-2 pb-2 lg:hidden">
        <div className="relative h-[clamp(240px,66vw,420px)] overflow-hidden rounded-[2rem] border-[3px] border-white/80 shadow-[0_28px_50px_-30px_rgba(80,55,25,0.8)]">
          {/* only the lower part of the picture: the logo painted in its sky stays out */}
          <Image
            src="/images/home/hero.png"
            alt={t.home.heroImageAlt}
            width={1672}
            height={941}
            priority
            unoptimized
            className="absolute bottom-0 left-[-82%] h-auto w-[215%] max-w-none"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent"
            aria-hidden
          />
          <ProductComposition className="absolute bottom-[2%] left-[1%] aspect-[360/300] w-[56%] max-w-[300px]" />
        </div>
      </div>

      {/* desktop: the whole background */}
      <div className="relative order-2 hidden h-[var(--hero-h)] overflow-hidden lg:absolute lg:inset-0 lg:block lg:h-auto">
        <HeroLayer className="absolute -inset-4" depth={-0.6} zoom={0.1} origin="66% 88%">
          <Image
            src="/images/home/hero.png"
            alt=""
            width={1672}
            height={941}
            priority
            unoptimized
            className="absolute bottom-0 right-0 h-auto max-w-none"
            style={{ width: imageWidth }}
          />
        </HeroLayer>
        {/* melts into the cream sky on the left and at the top */}
        <div
          className="absolute inset-0 hidden bg-[linear-gradient(to_right,#F7E9D1_0%,rgba(247,233,209,0.92)_18%,rgba(247,233,209,0.55)_32%,rgba(247,233,209,0.12)_46%,transparent_56%)] lg:block"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#F7E9D1] to-transparent lg:h-40"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-nk-cream to-transparent lg:h-24"
          aria-hidden
        />
      </div>

      {/* WebGL clouds, pollen and light on desktops; CSS clouds otherwise */}
      <HeroAtmosphereSlot className="pointer-events-none absolute inset-0 hidden lg:block">
        <Cloud className="left-[34%] top-[16%] h-16 w-60 [--drift:60px]" />
        <Cloud
          className="right-[6%] top-[26%] h-14 w-52 [--drift:-50px] [--drift-duration:32s]"
          style={{ animationDelay: '-8s' }}
        />
      </HeroAtmosphereSlot>

      <HeroLayer
        className="pointer-events-none absolute inset-0 hidden lg:block"
        depth={1}
        zoom={0.22}
        origin="64% 92%"
      >
        <ProductComposition className="absolute bottom-[9%] left-[52%] aspect-[360/300] w-[clamp(300px,27vw,470px)]" />
      </HeroLayer>
      <HeroLayer
        className="pointer-events-none absolute inset-0 hidden lg:block"
        depth={1.8}
        lift={160}
      >
        <Eagle className="right-[30%] top-[18%] h-12 w-28" />
      </HeroLayer>
      <Branch className="-left-6 top-20 hidden xl:block" />

      <HeroLayer
        className="container relative z-10 order-1 pb-8 pt-[96px] lg:flex lg:h-full lg:items-center lg:pb-16 lg:pt-[80px]"
        depth={0.25}
        lift={120}
        fade
      >
        <div className="max-w-[640px]">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-1.5 text-xs font-medium text-nk-ink shadow-sm backdrop-blur motion-safe:animate-fade-up">
            <LeafIcon width={16} height={16} className="text-nk-forest" />
            {t.home.heroBadge}
          </p>
          <TextReveal
            as="h1"
            id="hero-title"
            immediate
            delay={0.1}
            text={t.home.heroTitle}
            className="mt-5 font-serif text-[clamp(2.4rem,4.3vw,4.3rem)] font-semibold leading-[1.02] tracking-tight text-nk-ink"
          />
          <p
            className="mt-5 max-w-[30rem] text-base leading-relaxed text-nk-ink/85 motion-safe:animate-fade-up sm:text-lg"
            style={{ animationDelay: '0.45s' }}
          >
            {t.home.heroText}
          </p>
          <div
            className="mt-8 flex flex-wrap items-center gap-5 motion-safe:animate-fade-up"
            style={{ animationDelay: '0.6s' }}
          >
            <Magnetic>
              <Link href={`/${locale}/catalog`} className="btn-forest group">
                {t.nav.goToCatalog}
                <ArrowRightIcon
                  width={18}
                  height={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </Magnetic>
            <a
              {...more}
              className="group inline-flex items-center gap-3 text-sm font-medium text-nk-ink"
            >
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-nk-forest shadow-[0_10px_24px_-12px_rgba(43,42,34,0.6)] transition group-hover:scale-105">
                <span
                  className="absolute inset-0 rounded-full ring-2 ring-white/70 motion-safe:animate-ping-slow"
                  aria-hidden
                />
                <PlayIcon width={18} height={18} />
              </span>
              {t.home.heroMore}
            </a>
          </div>
        </div>
      </HeroLayer>
    </HeroStage>
  );
}
