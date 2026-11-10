import type { ReactNode } from 'react';

import type { ProductCard } from '@nuska/types';
import Image from 'next/image';
import Link from 'next/link';

import { Leaf, MountainLines, Wave } from '@/components/brand/kyrgyz-decor';
import { LogoMark } from '@/components/brand/logo';
import {
  ArrowRightIcon,
  DiamondIcon,
  HeartIcon,
  LeafIcon,
  PlayIcon,
  ShieldIcon,
} from '@/components/ui/icons';
import { Reveal } from '@/components/ui/reveal';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { formatMoney } from '@/lib/format';

/** Colours of the company's design. */
const CREAM = '#EAD5AE';
const GREEN = '#1F331B';

const Knot = ({ className }: { className?: string }) => <LogoMark className={className} />;

/** Small gold knot between thin lines (above the section titles). */
function TitleMark() {
  return (
    <div className="mx-auto mb-3 flex w-40 items-center gap-3" aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9A45C]" />
      <Knot className="h-5 w-5" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9A45C]" />
    </div>
  );
}

// ---------------------------------------------------------------- 02 why us

const WHY_ICONS: ((props: { className?: string }) => ReactNode)[] = [
  (p) => <LeafIcon width={52} height={52} strokeWidth={1.1} {...p} />,
  (p) => <ShieldIcon width={52} height={52} strokeWidth={1.1} {...p} />,
  (p) => <Knot className={`h-[52px] w-[52px] ${p.className ?? ''}`} />,
  (p) => <HeartIcon width={52} height={52} strokeWidth={1.1} {...p} />,
];

/** "Why choose us?": title on cream, four deep green cards, melting into green. */
export function WhyUs({ t }: { t: Dictionary }) {
  return (
    <section
      className="relative overflow-hidden pb-16 pt-6 sm:pb-20"
      style={{
        background: `linear-gradient(to bottom, ${CREAM} 0%, ${CREAM} 30%, #6F7F52 62%, ${GREEN} 88%)`,
      }}
      aria-labelledby="why-title"
    >
      <Leaf className="absolute left-8 top-16 hidden h-12 w-20 [--sway-from:-32deg] [--sway-to:-20deg] sm:block" />
      <Leaf
        className="absolute right-8 top-2 hidden h-12 w-20 [--sway-from:150deg] [--sway-to:162deg] sm:block"
        style={{ animationDelay: '-3s' }}
      />
      <div className="container relative">
        <Reveal className="text-center">
          <Knot className="mx-auto h-6 w-6" />
          <h2
            id="why-title"
            className="mt-2 font-serif text-3xl font-semibold text-[#1F331B] sm:text-[2.6rem]"
          >
            {t.home.whyTitle}
          </h2>
          <Knot className="mx-auto mt-3 h-5 w-5 opacity-70" />
        </Reveal>
        <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-7">
          {t.home.why.map((item, i) => {
            const Icon = WHY_ICONS[i % WHY_ICONS.length];
            return (
              <li key={item.title}>
                <Reveal delay={i * 0.08} className="h-full">
                  <div className="group flex h-full flex-col items-center rounded-[1.75rem] border border-white/10 bg-[#27391F]/90 px-4 py-7 text-center shadow-[0_24px_40px_-24px_rgba(15,25,10,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1.5 hover:border-[#D6AD62]/50">
                    <Icon className="text-[#E2B96A] transition duration-500 group-hover:scale-110" />
                    <h3 className="mt-5 font-sans text-base font-semibold text-white sm:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-[13rem] text-sm leading-relaxed text-[#EADFC2]/85">
                      {item.text}
                    </p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- 03 prices

/**
 * The podium: for each wooden block the catalog product standing on it
 * (matched by slug, sizes included), the place of its price plate and the
 * place of the company's product photo. Everything is in design pixels of
 * the 726 × 282 podium picture and is turned into % below, so the photos and
 * the plates scale together with the picture.
 */
const PODIUM_W = 726;
const PODIUM_H = 282;
const PODIUM = [
  {
    key: 'zhupka',
    plate: { left: 10.7, top: 56.4, width: 12.1, height: 19 },
    photo: { src: 'zhupka.png', w: 480, h: 733, cx: 122, bottom: 160, height: 150, rotate: 0 },
  },
  {
    key: 'sary-mai',
    plate: { left: 29.3, top: 64.2, width: 12.1, height: 18.4 },
    photo: { src: 'sary-mai.png', w: 825, h: 1148, cx: 257, bottom: 179, height: 122, rotate: 0 },
  },
  {
    key: 'kymyz',
    plate: { left: 45.4, top: 66, width: 11.4, height: 18.4 },
    photo: { src: 'kymyz.png', w: 137, h: 470, cx: 372, bottom: 187, height: 172, rotate: 0 },
  },
  {
    key: 'keremet-shypaa',
    plate: { left: 61.2, top: 60.7, width: 11.6, height: 18.4 },
    // the photo shows the bottle tilted; it is stood upright with a CSS rotation
    photo: {
      src: 'keremet-shypaa.png',
      w: 681,
      h: 1263,
      cx: 487,
      bottom: 175,
      height: 166,
      rotate: -19.6,
    },
  },
  {
    key: 'navat',
    plate: { left: 77.9, top: 56.4, width: 11.7, height: 19 },
    photo: { src: 'navat.png', w: 723, h: 566, cx: 608, bottom: 159, height: 98, rotate: 0 },
  },
] as const;

const SIZE = /\s+(\d+(?:[.,]\d+)?\s*(?:кг|л|г|мл)?)$/i;
/** "Нават 0.5" → "Нават", "Керемет шыпаа — классика" → "Керемет шыпаа". */
const lineName = (name: string) =>
  name
    .split(/\s+[—–-]\s+/)[0]
    .replace(SIZE, '')
    .trim();

function productLine(products: ProductCard[], key: string) {
  const variants = products
    .filter((p) => p.slug === key || p.slug.startsWith(`${key}-`))
    .sort((a, b) => a.price.amount - b.price.amount);
  if (variants.length === 0) return null;
  return { name: lineName(variants[0].name), cheapest: variants[0], many: variants.length > 1 };
}

/**
 * "Our prices": the wooden podium of the design with a plate under each
 * product. The names and prices on the plates are live catalog data.
 */
export function PricesPodium({
  t,
  locale,
  products,
}: {
  t: Dictionary;
  locale: Locale;
  products: ProductCard[];
}) {
  const plates = PODIUM.flatMap((slot) => {
    const line = productLine(products, slot.key);
    if (!line) return [];
    const price = formatMoney(line.cheapest.price, locale, t.common.som);
    return [
      {
        key: slot.key,
        ...slot.plate,
        name: line.name,
        price: line.many ? t.home.pricesFrom.replace('{price}', price) : price,
        href: `/${locale}/product/${line.cheapest.slug}`,
      },
    ];
  });

  return (
    <section
      id="prices"
      className="relative scroll-mt-16 overflow-hidden"
      style={{ backgroundColor: GREEN }}
      aria-labelledby="prices-title"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(74,110,58,0.45),transparent_60%)]"
        aria-hidden
      />
      <Leaf className="absolute left-[5%] top-24 h-9 w-14 [--sway-from:-150deg] [--sway-to:-138deg]" />
      <Leaf
        className="absolute right-[6%] top-28 h-9 w-14 [--sway-from:-30deg] [--sway-to:-18deg]"
        style={{ animationDelay: '-2s' }}
      />
      <Reveal className="container relative pt-4 text-center sm:pt-8">
        <h2 id="prices-title" className="font-serif text-4xl text-[#F6EBCF] sm:text-5xl">
          {t.home.pricesTitle}
        </h2>
        <p className="mt-3 text-base text-[#E7C77F] sm:text-lg">{t.home.pricesText}</p>
      </Reveal>

      <div className="relative mt-2 [container-type:inline-size]">
        <div className="relative aspect-[2400/932] w-full">
          {/* the wooden podium of the design; above it the section background shows */}
          <div className="absolute inset-x-0 bottom-0 h-[57.45%]">
            <Image
              src="/images/home/podium-base.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover [mask-image:linear-gradient(to_bottom,transparent_2%,#000_20%)]"
            />
          </div>
          {/* the company's product photos, exactly as sent, standing on the blocks */}
          {PODIUM.map(({ key, photo }, i) => (
            <div
              key={key}
              className="absolute -translate-x-1/2"
              style={{
                left: `${(photo.cx / PODIUM_W) * 100}%`,
                bottom: `${((PODIUM_H - photo.bottom) / PODIUM_H) * 100}%`,
                height: `${(photo.height / PODIUM_H) * 100}%`,
                aspectRatio: `${photo.w} / ${photo.h}`,
              }}
            >
              <div
                className="h-full w-full motion-safe:animate-fade-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <Image
                  src={`/images/products/${photo.src}`}
                  alt={i === 0 ? t.home.pricesImageAlt : ''}
                  width={photo.w}
                  height={photo.h}
                  quality={95}
                  sizes="(min-width: 640px) 18vw, 24vw"
                  className="h-full w-full object-contain drop-shadow-[0_0.9cqw_0.7cqw_rgba(15,10,0,0.5)]"
                  style={photo.rotate ? { transform: `rotate(${photo.rotate}deg)` } : undefined}
                />
              </div>
            </div>
          ))}
          {/* the plates: live names and prices (hidden on phones, listed below instead) */}
          {plates.map((plate, i) => (
            <Link
              key={plate.key}
              href={plate.href}
              className="group absolute hidden flex-col items-center justify-center rounded-[1.2cqw] text-center text-white transition hover:bg-white/10 motion-safe:animate-fade-up sm:flex"
              style={{
                left: `${plate.left}%`,
                top: `${plate.top}%`,
                width: `${plate.width}%`,
                height: `${plate.height}%`,
                animationDelay: `${0.15 + i * 0.1}s`,
              }}
            >
              <span className="text-[1.45cqw] font-medium leading-[1.05] [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
                {plate.name}
              </span>
              <span className="mt-[0.15cqw] text-[1.6cqw] font-bold leading-[1.1] text-[#FFF4D6] [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
                {plate.price}
              </span>
            </Link>
          ))}
        </div>
        {/* the picture ends in cream; join it with the next section */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[7%]"
          style={{ background: `linear-gradient(to bottom, transparent, ${CREAM})` }}
          aria-hidden
        />
      </div>

      <ul
        className="grid grid-cols-2 gap-2 px-4 pb-8 pt-2 sm:hidden"
        style={{ backgroundColor: CREAM }}
      >
        {plates.map((plate) => (
          <li key={plate.key}>
            <Link
              href={plate.href}
              className="flex h-full flex-col rounded-2xl bg-[#27391F] px-4 py-3 text-white"
            >
              <span className="text-sm">{plate.name}</span>
              <span className="font-bold text-[#FFF4D6]">{plate.price}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------- 04 story

/** "About us": the meadow photo with a play button and the brand story. */
export function Story({
  t,
  locale,
  videoUrl,
}: {
  t: Dictionary;
  locale: Locale;
  videoUrl: string | null;
}) {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: `linear-gradient(to bottom, ${CREAM}, #F0DFC0)` }}
      aria-labelledby="story-title"
    >
      <Knot className="absolute -right-4 top-4 h-24 w-24 opacity-90 sm:h-28 sm:w-28" />
      <MountainLines className="absolute bottom-10 right-0 hidden w-[380px] text-[#B88B4A]/35 lg:block" />
      <div className="container relative grid items-center gap-8 pb-24 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-12">
        <Reveal>
          <figure className="relative aspect-[1200/937] overflow-hidden rounded-[1.75rem] shadow-[0_30px_50px_-24px_rgba(60,40,15,0.65)]">
            <Image
              src="/images/home/about.webp"
              alt={t.home.storyPhotoAlt}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover transition duration-[1.5s] hover:scale-105"
            />
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.home.storyVideo}
                className="group absolute left-1/2 top-[51%] flex h-[19%] aspect-square -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#27391F]/75 backdrop-blur-sm transition hover:scale-110"
              >
                <span className="flex h-[58%] w-[58%] items-center justify-center rounded-full bg-gradient-to-b from-[#F3D896] to-[#D6AD62] text-[#27391F] shadow-lg">
                  <PlayIcon width={18} height={18} className="translate-x-px" />
                </span>
                <span
                  className="absolute inset-0 rounded-full border border-[#E7C77F]/60 motion-safe:animate-ping"
                  aria-hidden
                />
              </a>
            )}
          </figure>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#8A6A32]">
            {t.nav.about}
            <span className="h-px w-8 bg-[#B88B4A]/60" aria-hidden />
          </p>
          <h2
            id="story-title"
            className="mt-4 max-w-md font-serif text-4xl font-semibold leading-tight text-[#1F331B] sm:text-[2.75rem]"
          >
            {t.home.storyTitle}
          </h2>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-[#3A3323]">
            {t.home.storyText}
          </p>
          <Link href={`/${locale}/about`} className="btn-gold mt-8 px-7 py-3.5 text-[15px]">
            {t.home.storyCta}
            <ArrowRightIcon width={18} height={18} />
          </Link>
        </Reveal>
      </div>
      <Leaf className="absolute bottom-16 right-6 h-10 w-16 [--sway-from:-150deg] [--sway-to:-140deg]" />
      <Wave className="absolute inset-x-0 -bottom-px h-12 text-[#21381D] sm:h-20" variant={2} />
    </section>
  );
}

// ---------------------------------------------------------------- 05 products

const CARDS = ['sary-mai', 'zhupka', 'besh-barmak', 'kymyz', 'keremet-shypaa', 'navat'] as const;

/** "Our products": the company's package photos, each card opening its product. */
export function ProductsRow({
  t,
  locale,
  products,
}: {
  t: Dictionary;
  locale: Locale;
  products: ProductCard[];
}) {
  return (
    <section className="relative bg-[#21381D] pb-10 pt-6" aria-labelledby="products-title">
      <Leaf className="absolute left-2 top-10 h-10 w-16 [--sway-from:-32deg] [--sway-to:-20deg]" />
      <Knot className="absolute right-4 top-24 hidden h-16 w-16 opacity-80 lg:block" />
      <div className="container relative">
        <Reveal className="text-center">
          <TitleMark />
          <h2 id="products-title" className="font-serif text-4xl text-[#F6EBCF] sm:text-[2.75rem]">
            {t.home.productsTitle}
          </h2>
          <p className="mt-2 text-base text-[#EADFC2] sm:text-lg">{t.home.productsText}</p>
        </Reveal>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-5">
          {CARDS.map((key, i) => {
            const line = productLine(products, key);
            const name = line?.name ?? t.home.productNames[i];
            return (
              <li key={key}>
                <Reveal delay={i * 0.06} className="h-full">
                  <Link
                    href={line ? `/${locale}/product/${line.cheapest.slug}` : `/${locale}/catalog`}
                    className="group relative block overflow-hidden rounded-[1.4rem] border border-[#E7C77F]/25 shadow-[0_24px_40px_-22px_rgba(0,0,0,0.75)] transition duration-300 hover:-translate-y-1.5 hover:border-[#E7C77F]/70"
                  >
                    <span className="relative block aspect-[4/5] bg-[radial-gradient(circle_at_50%_38%,#FBF3DC_0%,#E9D6A8_38%,#55683B_78%,#27391F_100%)]">
                      <Image
                        src={`/images/products/${key}.png`}
                        alt=""
                        fill
                        quality={95}
                        sizes="(min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
                        className="object-contain px-[12%] pb-[30%] pt-[8%] drop-shadow-[0_14px_14px_rgba(25,15,0,0.45)] transition duration-500 group-hover:scale-110"
                      />
                      <span
                        className="absolute inset-0 bg-gradient-to-t from-[#1B2D17] via-[#1B2D17]/40 via-25% to-transparent to-45%"
                        aria-hidden
                      />
                    </span>
                    <span className="absolute inset-x-0 bottom-0 px-3 pb-3 text-center">
                      <span className="block text-base font-medium text-white sm:text-lg">
                        {name}
                      </span>
                      {line && (
                        <span className="block text-sm font-semibold text-[#E7C77F]">
                          {line.many
                            ? t.home.pricesFrom.replace(
                                '{price}',
                                formatMoney(line.cheapest.price, locale, t.common.som)
                              )
                            : formatMoney(line.cheapest.price, locale, t.common.som)}
                        </span>
                      )}
                    </span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- 06 promises

const PROMISE_ICONS = [
  <LeafIcon key="leaf" width={46} height={46} strokeWidth={1.1} />,
  <DiamondIcon key="diamond" width={46} height={46} strokeWidth={1.1} />,
  <Knot key="knot" className="h-[46px] w-[46px]" />,
  <HeartIcon key="heart" width={46} height={46} strokeWidth={1.1} />,
];

/** Strip of four promises in one rounded panel. */
export function Promises({ t }: { t: Dictionary }) {
  return (
    <section className="bg-[#21381D] pb-2" aria-label={t.home.whyTitle}>
      <div className="container">
        <Reveal>
          <ul className="grid grid-cols-2 gap-y-6 rounded-[1.75rem] border border-[#E7C77F]/25 bg-[#27391F]/80 px-4 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:grid-cols-4 md:py-7">
            {t.home.promises.map((item, i) => (
              <li
                key={item.top}
                className="flex flex-col items-center px-3 text-center md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-[#E7C77F]/25"
              >
                <span className="text-[#E2B96A]">{PROMISE_ICONS[i % PROMISE_ICONS.length]}</span>
                <span className="mt-3 text-lg font-semibold leading-tight text-white">
                  {item.top}
                </span>
                <span className="text-sm text-[#EADFC2]/85">{item.bottom}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- 07 closing

/** Closing landscape with the yurt and the horse and the "Buy" button. */
export function ClosingCta({ t, locale }: { t: Dictionary; locale: Locale }) {
  return (
    <section
      className="relative overflow-hidden bg-[#21381D]"
      aria-labelledby="cta-title"
      data-flush-footer
    >
      <div className="relative h-[330px] sm:h-auto sm:aspect-[2400/648]">
        <Image
          src="/images/home/cta.webp"
          alt=""
          fill
          sizes="(min-width: 640px) 100vw, 300vw"
          className="object-cover object-[8%_center] sm:object-center"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_bottom,#21381D,transparent_22%,transparent_82%,#1B2616)]"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[#1B2D17]/45 sm:hidden" aria-hidden />
        <Reveal className="absolute inset-0 flex flex-col items-center justify-center px-4 pb-[4%] text-center">
          <h2
            id="cta-title"
            className="max-w-[26ch] font-serif text-[1.7rem] leading-snug text-[#FAF3DF] [text-shadow:0_2px_14px_rgba(10,22,8,0.7)] sm:text-[clamp(1.4rem,2.9vw,2.9rem)]"
          >
            {t.home.ctaTitle}
          </h2>
          <Link
            href={`/${locale}/catalog`}
            className="btn-gold mt-5 px-9 py-3.5 text-base sm:mt-[1.6vw] sm:text-[clamp(0.9rem,1.2vw,1.15rem)]"
          >
            {t.home.ctaButton}
            <ArrowRightIcon width={18} height={18} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
