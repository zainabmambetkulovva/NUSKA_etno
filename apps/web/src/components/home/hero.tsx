import type { CategoryNode } from '@nuska/types';
import Image from 'next/image';
import Link from 'next/link';

import { HeroAtmosphereSlot, HeroLayer, HeroStage } from './hero-stage';

import { LogoMark } from '@/components/brand/logo';
import { Cloud, Eagle } from '@/components/brand/nature-decor';
import { Magnetic } from '@/components/motion/magnetic';
import { TextReveal } from '@/components/motion/text-reveal';
import { ArrowRightIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';

/**
 * The company's products on the carved tray (public/images/home/tray-wood.webp,
 * drawn in code by scripts/podium, scene "tray"). `x`, `y` are the stand points
 * printed by the render (units of the 1300 × 520 tray box); `height` is in %
 * of the box. Each stands on its own spot: none covers another.
 */
const TRAY_ITEMS = [
  { src: '/images/dishes/kymyz.png', w: 1536, h: 1024, x: 262.4, y: 360.3, height: 27 },
  { src: '/images/products/zhupka.png', w: 480, h: 733, x: 459.1, y: 355.2, height: 47 },
  { src: '/images/products/navat.png', w: 723, h: 566, x: 627.5, y: 381, height: 22 },
  { src: '/images/products/kymyz.webp', w: 669, h: 2000, x: 769.9, y: 352.7, height: 58 },
  { src: '/images/products/sary-mai.png', w: 825, h: 1148, x: 921, y: 375.2, height: 33 },
  {
    src: '/images/products/keremet-shypaa.png',
    w: 681,
    h: 1263,
    x: 1072,
    y: 356.4,
    height: 54,
    rotate: -19.6,
  },
] as const;

/** The labels hang on one row, this far down the tray box (%). */
const LABEL_ROW = 112;
/** Where the leader lines of the category labels meet the tray rim (% of the tray box). */
const RIM = [
  { x: 11, y: 84 },
  { x: 30.5, y: 95 },
  { x: 50, y: 97.5 },
  { x: 69.5, y: 95 },
  { x: 89, y: 84 },
];

function Tray({ t, className }: { t: Dictionary; className?: string }) {
  return (
    <div className={className} role="img" aria-label={t.home.heroTrayLabel}>
      <div className="relative aspect-[1300/520] w-full">
        <Image
          src="/images/home/tray-wood.webp"
          alt=""
          fill
          priority
          unoptimized
          className="object-contain motion-safe:animate-fade-up"
        />
        {TRAY_ITEMS.map((item, i) => (
          <div
            key={item.src}
            className="absolute -translate-x-1/2"
            style={{
              left: `${(item.x / 1300) * 100}%`,
              bottom: `${((520 - item.y) / 520) * 100}%`,
              height: `${item.height}%`,
              aspectRatio: `${item.w} / ${item.h}`,
            }}
          >
            <div
              className="h-full w-full motion-safe:animate-fade-up"
              style={{ animationDelay: `${0.25 + i * 0.09}s` }}
            >
              <Image
                src={item.src}
                alt=""
                width={item.w}
                height={item.h}
                priority={i < 4}
                quality={95}
                sizes="(min-width: 1024px) 260px, 30vw"
                className="h-full w-full origin-bottom object-contain drop-shadow-[0_18px_14px_rgba(60,35,10,0.38)] transition duration-500 ease-out hover:-translate-y-[4%] hover:scale-[1.04]"
                style={'rotate' in item ? { transform: `rotate(${item.rotate}deg)` } : undefined}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * First screen after the company's mockup: «Табияттан. Дасторконго.» in large
 * serif over a band of mountains, the side note on the left, the carved tray
 * with the products (drawn in code + the company's photos), the round
 * «Каталогго өтүү» button and the categories hanging from the tray on thin
 * gold lines. WebGL pollen and clouds on desktops (paused off screen).
 */
export function Hero({
  locale,
  t,
  categories,
}: {
  locale: Locale;
  t: Dictionary;
  categories: CategoryNode[];
}) {
  const shown = categories.slice(0, 5);
  return (
    <HeroStage
      labelledBy="hero-title"
      className="relative -mt-[68px] overflow-hidden bg-nk-cream pb-12 pt-[92px] lg:-mt-[80px] lg:pb-16 lg:pt-[96px]"
    >
      {/* warm sky */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#FFF6E6_0%,#F7EBD3_55%,#F4E6CB_100%)]"
        aria-hidden
      />
      {/* the band of mountains behind the tray, melting into the cream above and below */}
      <HeroLayer
        className="absolute inset-x-0 top-[28%] h-[40%] sm:top-[24%] lg:top-[20%] lg:h-[42%]"
        depth={-0.5}
        zoom={0.08}
      >
        {/* only the upper part of the picture (sky, peaks, forest): the box is clipped,
            the picture inside is taller, so the meadow with the animals stays below */}
        <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,#000_26%,#000_58%,transparent_92%)]">
          <div className="absolute inset-x-0 top-0 h-[240%]">
            <Image
              src="/images/home/about.png"
              alt=""
              fill
              priority
              unoptimized
              className="object-cover object-top"
            />
          </div>
        </div>
      </HeroLayer>

      <HeroAtmosphereSlot className="pointer-events-none absolute inset-0 hidden lg:block">
        <Cloud className="left-[30%] top-[20%] h-16 w-60 [--drift:60px]" />
        <Cloud
          className="right-[8%] top-[26%] h-14 w-52 [--drift:-50px] [--drift-duration:32s]"
          style={{ animationDelay: '-8s' }}
        />
      </HeroAtmosphereSlot>
      <HeroLayer
        className="pointer-events-none absolute inset-0 hidden lg:block"
        depth={1.6}
        lift={140}
      >
        <Eagle className="right-[24%] top-[16%] h-10 w-24" />
      </HeroLayer>

      <div className="container relative">
        {/* left note with the gold knot and a gold rule */}
        <div className="relative z-10 max-w-[13rem] motion-safe:animate-fade-up lg:absolute lg:left-4 lg:top-2 xl:left-0">
          <LogoMark className="h-9 w-9 motion-safe:animate-[spin_24s_linear_infinite] lg:h-11 lg:w-11" />
          <div className="mt-3 border-l-2 border-nk-gold/70 pl-4 lg:mt-4">
            <p className="font-serif text-[1.2rem] leading-snug text-nk-ink sm:text-[1.55rem]">
              {t.home.heroSide}
            </p>
            <span className="my-3 block h-px w-12 bg-nk-gold" aria-hidden />
            <p className="font-serif text-[15px] leading-relaxed text-nk-muted">
              {t.home.heroSideText}
            </p>
          </div>
        </div>

        {/* the large title */}
        <HeroLayer className="relative z-10 mt-6 lg:mt-0" depth={0.25} lift={60}>
          <h1
            id="hero-title"
            aria-label={`${t.home.heroLine1} ${t.home.heroLine2}`}
            className="font-serif text-[clamp(2.9rem,9vw,8.6rem)] font-semibold leading-[0.88] tracking-tight text-[#1F3A22]"
          >
            <TextReveal as="span" immediate text={t.home.heroLine1} className="block lg:pl-[23%]" />
            <TextReveal
              as="span"
              immediate
              delay={0.18}
              text={t.home.heroLine2}
              className="block lg:pl-[17.5%]"
            />
          </h1>
        </HeroLayer>

        {/* the tray with the products; it rides a little over the title */}
        <HeroLayer
          className="relative z-20 -mt-[9%] sm:-mt-[11%] lg:-mt-[12.5%]"
          depth={0.6}
          zoom={0.05}
          origin="50% 90%"
        >
          <Tray t={t} className="mx-auto w-full max-w-[1180px]" />

          {/* categories on gold lines from the tray rim (desktop) */}
          <ul
            className="pointer-events-none absolute inset-x-0 mx-auto hidden max-w-[1180px] lg:block"
            style={{ top: 0, height: '100%' }}
          >
            {shown.map((category, i) => {
              const rim = RIM[i];
              return (
                // each item covers the tray box, so its parts are placed in % of the box
                <li key={category.slug} className="absolute inset-0">
                  <span
                    className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-nk-gold bg-white shadow-[0_0_0_4px_rgba(199,166,106,0.18)]"
                    style={{ left: `${rim.x}%`, top: `${rim.y}%` }}
                    aria-hidden
                  />
                  <span
                    className="absolute w-px origin-top bg-gradient-to-b from-nk-gold to-nk-gold/30 motion-safe:animate-[grow-y_0.9s_ease-out_both]"
                    style={{
                      left: `${rim.x}%`,
                      top: `${rim.y}%`,
                      height: `${LABEL_ROW - rim.y}%`,
                      animationDelay: `${0.8 + i * 0.1}s`,
                    }}
                    aria-hidden
                  />
                  <Link
                    href={`/${locale}/catalog/${category.slug}`}
                    className="group pointer-events-auto absolute flex -translate-x-1/2 items-center gap-2 whitespace-nowrap pt-2 font-serif text-[1.2rem] text-nk-ink transition hover:text-nk-forest motion-safe:animate-fade-up"
                    style={{
                      left: `${rim.x}%`,
                      top: `${LABEL_ROW}%`,
                      animationDelay: `${1 + i * 0.1}s`,
                    }}
                  >
                    {category.name}
                    <ArrowRightIcon
                      width={18}
                      height={18}
                      className="transition group-hover:translate-x-1"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </HeroLayer>

        {/* categories on phones and tablets */}
        <ul className="relative z-20 mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:hidden">
          {shown.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/${locale}/catalog/${category.slug}`}
                className="flex h-full items-center justify-between gap-2 rounded-2xl border border-nk-gold/40 bg-white/85 px-3.5 py-2 font-serif text-[14px] leading-tight text-nk-ink shadow-sm backdrop-blur transition hover:border-nk-gold"
              >
                {category.name}
                <ArrowRightIcon width={15} height={15} className="shrink-0 text-nk-gold" />
              </Link>
            </li>
          ))}
        </ul>

        {/* round «Каталогго өтүү» */}
        <div className="relative z-30 mt-8 flex justify-center lg:absolute lg:right-2 lg:top-[38%] lg:mt-0 xl:right-0">
          <Magnetic>
            <Link
              href={`/${locale}/catalog`}
              className="group relative flex h-36 w-36 flex-col items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#3C6A47,#22392A)] text-center font-serif text-lg leading-tight text-[#F6EBCF] shadow-[0_24px_50px_-18px_rgba(34,57,42,0.85)] transition duration-300 hover:scale-105 lg:h-52 lg:w-52 lg:text-[1.65rem]"
            >
              <span
                className="absolute inset-1.5 rounded-full border border-dashed border-nk-gold/70 motion-safe:animate-[spin_18s_linear_infinite]"
                aria-hidden
              />
              <span
                className="absolute -inset-1 rounded-full border border-nk-gold/50"
                aria-hidden
              />
              <span className="relative px-5">{t.nav.goToCatalog}</span>
              <ArrowRightIcon
                width={30}
                height={30}
                className="relative mt-2 transition duration-300 group-hover:translate-x-1.5"
              />
            </Link>
          </Magnetic>
        </div>
      </div>
      {/* room for the hanging labels on desktop */}
      <div className="hidden h-24 lg:block" aria-hidden />
    </HeroStage>
  );
}
