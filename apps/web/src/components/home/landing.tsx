import type { ReactNode } from 'react';

import type { CategoryNode, ProductCard } from '@nuska/types';
import Image from 'next/image';
import Link from 'next/link';

import { Bestsellers } from './bestsellers';
import { OriginMap } from './origin-map';

import { LogoMark } from '@/components/brand/logo';
import { Branch } from '@/components/brand/nature-decor';
import { ImageReveal } from '@/components/motion/image-reveal';
import { TextReveal } from '@/components/motion/text-reveal';
import { Tilt } from '@/components/motion/tilt';
import {
  ArrowRightIcon,
  DiamondIcon,
  HeartIcon,
  LeafIcon,
  MountainIcon,
  ShieldIcon,
  SproutIcon,
  StarIcon,
  TruckIcon,
} from '@/components/ui/icons';
import { Reveal } from '@/components/ui/reveal';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="eyebrow">
      <StarIcon width={16} height={16} className="text-nk-gold" aria-hidden />
      {children}
    </p>
  );
}

// ------------------------------------------------------------- benefits bar

const BENEFIT_ICONS = [
  <LeafIcon key="leaf" width={34} height={34} strokeWidth={1.4} className="text-nk-forest" />,
  <MountainIcon
    key="mountain"
    width={34}
    height={34}
    strokeWidth={1.4}
    className="text-nk-forest"
  />,
  <span
    key="shield"
    className="flex h-10 w-10 items-center justify-center rounded-full bg-nk-forest text-white"
  >
    <ShieldIcon width={24} height={24} strokeWidth={1.8} />
  </span>,
  <TruckIcon key="truck" width={34} height={34} strokeWidth={1.4} className="text-nk-forest" />,
  <HeartIcon key="heart" width={34} height={34} strokeWidth={1.4} className="text-nk-gold" />,
];

/** Five promises on a translucent white strip overlapping the hero (company's own claims only). */
export function BenefitsBar({ t }: { t: Dictionary }) {
  return (
    <section
      className="container relative z-20 mt-4 lg:mt-6"
      aria-label={t.landing.productsEyebrow}
    >
      <ul className="grid grid-cols-2 gap-x-2 gap-y-4 rounded-[1.75rem] border border-white/80 bg-white/80 px-4 py-5 shadow-[0_24px_50px_-30px_rgba(80,60,30,0.6)] backdrop-blur-md sm:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:px-6">
        {t.landing.benefits.map((benefit, i) => (
          <li
            key={benefit.top}
            className="flex items-center gap-3 odd:last:col-span-2 odd:last:justify-center sm:odd:last:col-span-1 sm:odd:last:justify-start lg:justify-center lg:border-l lg:border-nk-beige lg:px-3 lg:first:border-l-0 lg:odd:last:justify-center"
          >
            <span className="shrink-0 transition-transform duration-300 hover:scale-110">
              {BENEFIT_ICONS[i]}
            </span>
            <span className="text-[13px] leading-snug text-nk-ink sm:text-sm">
              {benefit.top}
              <br />
              {benefit.bottom}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ----------------------------------------------------------- category arches

/** Photo of each real category (the company's dish photos); null = photo to come. */
const CATEGORY_PHOTOS: Record<string, string | null> = {
  'natural-honey': '/images/dishes/bal.png',
  'dairy-products': '/images/dishes/sary-mai.png',
  'national-sweets': '/images/dishes/navat.png',
  'traditional-dishes': '/images/dishes/besh-barmak.png',
  'meat-products': '/images/products/kholodets.webp',
  drinks: '/images/products/kompot.webp',
};

/** «Сила природы в каждой детали»: text on the left, an arch card for every real category. */
export function CategoryArches({
  t,
  locale,
  categories,
}: {
  t: Dictionary;
  locale: Locale;
  categories: CategoryNode[];
}) {
  return (
    <section className="relative overflow-hidden py-16 lg:py-20" aria-labelledby="categories-title">
      <Branch className="-right-4 top-10 hidden lg:block" flip />
      <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,230px)_minmax(0,1fr)] lg:gap-8 xl:gap-8">
        <Reveal>
          <Eyebrow>{t.landing.productsEyebrow}</Eyebrow>
          <TextReveal
            id="categories-title"
            text={t.landing.productsTitle}
            className="mt-3 font-serif text-[2.1rem] leading-[1.1] text-nk-ink sm:text-[2.5rem]"
          />
          <p className="mt-4 text-[15px] leading-relaxed text-nk-muted">{t.landing.productsText}</p>
          <Link href={`/${locale}/catalog`} className="btn-forest group mt-7">
            {t.landing.productsButton}
            <ArrowRightIcon
              width={18}
              height={18}
              className="transition group-hover:translate-x-1"
            />
          </Link>
        </Reveal>

        {/* room above and below the scrolling row, so the lift on hover and the soft shadow are not cut */}
        <ul className="-mx-4 -my-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 py-10 [scrollbar-width:none] sm:mx-0 sm:my-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 sm:py-0 xl:grid-cols-6 [&::-webkit-scrollbar]:hidden">
          {categories.map((category, i) => {
            const photo = CATEGORY_PHOTOS[category.slug];
            return (
              <li key={category.slug} className="w-[46%] shrink-0 snap-start sm:w-auto">
                <Reveal delay={i * 0.06} className="h-full">
                  <Tilt
                    className="group relative h-full rounded-b-[1.6rem] rounded-t-[999px]"
                    max={7}
                  >
                    <Link
                      href={`/${locale}/catalog/${category.slug}`}
                      className="card-hover group relative flex aspect-[3/4.4] flex-col overflow-hidden rounded-t-[999px] rounded-b-[1.6rem] border-[3px] border-white/80 bg-[linear-gradient(180deg,#FBEFD9_0%,#F0D6AA_70%)] shadow-[0_24px_40px_-26px_rgba(80,55,25,0.75)] transition duration-500 hover:-translate-y-2 hover:border-nk-gold/70 hover:shadow-[0_32px_48px_-26px_rgba(80,55,25,0.85)]"
                    >
                      <span className="relative flex-1">
                        {photo ? (
                          <Image
                            src={photo}
                            alt=""
                            fill
                            quality={95}
                            sizes="(min-width: 1024px) 200px, 45vw"
                            className="object-contain px-2 pb-1 pt-6 drop-shadow-[0_14px_14px_rgba(70,45,20,0.35)] transition duration-700 [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent_2%,#000_16%,#000_78%,transparent_96%),linear-gradient(to_bottom,transparent_6%,#000_20%,#000_92%,transparent_100%)] group-hover:scale-110"
                          />
                        ) : (
                          <span className="flex h-full flex-col items-center justify-center gap-2 pt-6">
                            <LogoMark className="h-14 w-14 opacity-80 transition duration-700 group-hover:rotate-45" />
                            <span className="text-[11px] uppercase tracking-[0.2em] text-nk-brown/70">
                              {t.landing.categoryPhotoSoon}
                            </span>
                          </span>
                        )}
                      </span>
                      <span className="flex min-h-[4.5rem] items-center justify-center gap-1.5 bg-gradient-to-b from-nk-forest to-nk-deep px-2 py-3 text-center text-[15px] font-medium leading-tight text-white">
                        {category.name}
                        <ArrowRightIcon
                          width={15}
                          height={15}
                          className="shrink-0 transition group-hover:translate-x-1"
                        />
                      </span>
                    </Link>
                  </Tilt>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------- about

const VALUE_ICONS = [
  <DiamondIcon key="d" width={20} height={20} />,
  <SproutIcon key="s" width={20} height={20} />,
  <HeartIcon key="h" width={20} height={20} />,
  <LeafIcon key="l" width={20} height={20} />,
];

/** «Больше, чем натуральные продукты»: the valley with the girl, the brand text and the values. */
export function BrandAbout({ t, locale }: { t: Dictionary; locale: Locale }) {
  return (
    <section
      id="brand"
      className="relative scroll-mt-24 py-10 lg:py-16"
      aria-labelledby="brand-title"
    >
      <div className="container">
        <span
          className="block h-px w-full max-w-[44rem] bg-gradient-to-r from-nk-gold/70 to-transparent"
          aria-hidden
        />
      </div>
      <div className="container mt-8 grid grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
        <Reveal>
          {/* «01 / БИЗДИН ТАРЫХ ———» */}
          <p className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.32em] text-nk-brown">
            {t.landing.storyEyebrow}
            <span className="h-px w-24 bg-nk-gold/60" aria-hidden />
          </p>
          <TextReveal
            id="brand-title"
            text={t.landing.storyTitle}
            className="mt-5 font-serif text-[clamp(2.4rem,5vw,4.4rem)] font-medium leading-[1.04] text-[#1F3A22]"
          />
          <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-nk-muted">
            {t.landing.aboutText}
          </p>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {t.landing.values.map((value, i) => (
              <li
                key={value}
                className="group inline-flex items-center gap-2 rounded-full border border-nk-gold/40 bg-white/80 py-1.5 pl-1.5 pr-4 text-sm text-nk-ink shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-nk-gold hover:shadow-md"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nk-cream text-nk-brown transition group-hover:bg-nk-gold group-hover:text-white [&_svg]:h-4 [&_svg]:w-4">
                  {VALUE_ICONS[i]}
                </span>
                {value}
              </li>
            ))}
          </ul>
          <Link href={`/${locale}/about`} className="btn-forest group mt-8">
            {t.landing.aboutButton}
            <ArrowRightIcon
              width={18}
              height={18}
              className="transition group-hover:translate-x-1"
            />
          </Link>
        </Reveal>

        {/* yurt in the mountains with the girl, in a hill-shaped frame */}
        <Reveal className="relative h-[360px] sm:h-[440px] lg:h-[520px]">
          <ImageReveal
            from="right"
            className="absolute inset-0 overflow-hidden rounded-[2rem] rounded-tl-[58%_88%] shadow-[0_40px_70px_-45px_rgba(60,40,15,0.75)]"
          >
            <Image
              src="/images/home/cta.png"
              alt=""
              fill
              unoptimized
              className="object-cover object-[35%_58%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#F4E5CB]/45 via-transparent to-transparent" />
          </ImageReveal>
          <div className="absolute bottom-0 right-[6%] aspect-[1086/1448] h-[94%]">
            <Image
              src="/images/home/brand-girl.webp"
              alt={t.landing.aboutImageAlt}
              fill
              unoptimized
              className="object-contain object-bottom drop-shadow-[0_20px_30px_rgba(60,35,10,0.35)]"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// --------------------------------------------------- origin + bestsellers row

/** «Из сердца Кыргызстана» (large interactive map), then «Хиты продаж» (carousel) full width. */
export function OriginAndBestsellers({
  t,
  locale,
  products,
  bestsellers,
}: {
  t: Dictionary;
  locale: Locale;
  products: ProductCard[];
  bestsellers: ProductCard[];
}) {
  return (
    <section className="relative py-14 lg:py-16" aria-labelledby="origin-title">
      <div className="container space-y-14 lg:space-y-16">
        <Reveal className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
          <OriginMap products={products} compact className="mx-auto w-full min-w-0 max-w-[760px]" />
          <div className="max-w-md">
            <TextReveal
              id="origin-title"
              text={t.landing.originTitle}
              className="font-serif text-[2.2rem] leading-tight text-nk-ink sm:text-[2.6rem]"
            />
            <p className="mt-4 text-base leading-relaxed text-nk-muted">{t.landing.originText}</p>
            <Link
              href={`/${locale}/origin`}
              className="btn-forest group mt-6 whitespace-nowrap px-6 py-3 text-sm"
            >
              {t.landing.originButton}
              <ArrowRightIcon
                width={16}
                height={16}
                className="transition group-hover:translate-x-1"
              />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <Bestsellers products={bestsellers} />
        </Reveal>
      </div>
    </section>
  );
}
