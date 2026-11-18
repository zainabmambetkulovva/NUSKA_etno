import type { CategoryNode } from '@nuska/types';
import Image from 'next/image';
import Link from 'next/link';

import { HeroAtmosphereSlot, HeroLayer, HeroStage } from './hero-stage';

import { LogoMark } from '@/components/brand/logo';
import { Cloud } from '@/components/brand/nature-decor';
import { Magnetic } from '@/components/motion/magnetic';
import { TextReveal } from '@/components/motion/text-reveal';
import { ArrowRightIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';

/** Thin gold line icons of the mockup. */
function Icon({ name, className }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    leaf: (
      <>
        <path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14Z" />
        <path d="M5 19l8-8" />
      </>
    ),
    recipe: (
      <>
        <path d="M3.5 12h17a8.5 8.5 0 0 1-17 0Z" />
        <path d="M8 21h8M9 3.5c-1 1.4 1 2.4 0 4.2M12 3.5c-1 1.4 1 2.4 0 4.2M15 3.5c-1 1.4 1 2.4 0 4.2" />
      </>
    ),
    mountains: (
      <>
        <path d="M2 19 9 8l4 6 3-4 6 9Z" />
        <path d="M7.4 10.5 9 8l1.6 2.5" />
      </>
    ),
    candy: (
      <>
        <circle cx="12" cy="12" r="4.2" />
        <path d="M8.7 9.4 3.8 7l.9 5ZM15.3 14.6l4.9 2.4-.9-5Z" />
      </>
    ),
    milk: (
      <>
        <path d="M10 2.5h4v3l2 3v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-11l2-3Z" />
        <path d="M8 12.5h8" />
      </>
    ),
    meat: (
      <>
        <path d="M3.5 13c0-5 5-8.5 10.5-7.3 4.6 1 7 4.3 6 7.5-1 3.3-5.6 6.1-10.6 5-3.8-.7-5.9-2.4-5.9-5.2Z" />
        <circle cx="14.5" cy="11" r="2" />
      </>
    ),
    honey: (
      <>
        <path d="M6 10h12l-1.2 8.6A3 3 0 0 1 13.8 21h-3.6a3 3 0 0 1-3-2.4Z" />
        <path d="M5 10h14M8.5 10c0-1.8 1.4-3 3.5-3s3.5 1.2 3.5 3M15 6.5l4-4" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name] ?? paths.leaf}
    </svg>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  'national-sweets': 'candy',
  'dairy-products': 'milk',
  'traditional-dishes': 'recipe',
  'meat-products': 'meat',
  'natural-honey': 'honey',
};
const FEATURE_ICONS = ['leaf', 'recipe', 'mountains'];

/**
 * First screen after the company's mockup: on the left the gold knot and
 * «КЫРГЫЗСТАНДЫН ТАБИГЫЙ КҮЧҮ», the large «Табияттан. Дасторконго.», the
 * subtitle, «Каталогго өтүү» and «Бренд жөнүндө», three features; on the
 * right the mountains with the carved tray and the company's products (the
 * mockup's own picture, text removed); below, the categories with icons.
 * WebGL pollen over the picture on desktops.
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
      className="relative -mt-[68px] overflow-hidden bg-nk-cream pt-[84px] lg:-mt-[80px] lg:pt-[80px]"
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,#FFF8EC_0%,#F8EEDD_55%,#F4E8D2_100%)]"
        aria-hidden
      />

      <div className="relative flex flex-col lg:block lg:min-h-[min(47.5vw,820px)]">
        {/* the picture: right two thirds on desktop, a band under the text on phones */}
        <HeroLayer
          className="relative order-2 mt-6 aspect-[1026/763] w-full lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:w-[64vw] lg:max-w-[1100px]"
          depth={-0.35}
          zoom={0.06}
          origin="60% 80%"
        >
          <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_82%,transparent)] lg:[mask-image:linear-gradient(to_right,transparent_0%,#000_18%),linear-gradient(to_bottom,transparent_0%,#000_9%,#000_86%,transparent)] lg:[mask-composite:intersect]">
            <Image
              src="/images/home/hero-scene.webp"
              alt={t.home.heroSceneAlt}
              fill
              priority
              unoptimized
              className="object-cover motion-safe:animate-[hero-in_1.4s_cubic-bezier(.22,1,.36,1)_both]"
            />
          </div>
          <HeroAtmosphereSlot className="pointer-events-none absolute inset-0 hidden lg:block">
            <Cloud className="left-[30%] top-[6%] h-14 w-52 [--drift:50px]" />
            <Cloud
              className="right-[8%] top-[14%] h-12 w-44 [--drift:-40px] [--drift-duration:30s]"
              style={{ animationDelay: '-8s' }}
            />
          </HeroAtmosphereSlot>
        </HeroLayer>

        <div className="container relative z-10 -order-1 pt-6 lg:pt-[6vh] xl:pt-16">
          <div className="max-w-[40rem] lg:max-w-[46%]">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-nk-ink motion-safe:animate-fade-up sm:text-xs">
              <LogoMark className="h-9 w-9 shrink-0 motion-safe:animate-[spin_24s_linear_infinite]" />
              <span className="h-6 w-px bg-nk-gold" aria-hidden />
              {t.home.heroSide}
            </p>
            <h1
              id="hero-title"
              aria-label={`${t.home.heroLine1} ${t.home.heroLine2}`}
              className="mt-6 font-serif text-[clamp(2.9rem,7vw,6.4rem)] font-semibold leading-[0.95] tracking-tight text-[#1F3A22]"
            >
              <TextReveal
                as="span"
                immediate
                delay={0.1}
                text={t.home.heroLine1}
                className="block"
              />
              <TextReveal
                as="span"
                immediate
                delay={0.28}
                text={t.home.heroLine2}
                className="block"
              />
            </h1>
            <p
              className="mt-5 text-lg text-nk-ink/80 motion-safe:animate-fade-up sm:text-[1.45rem]"
              style={{ animationDelay: '0.5s' }}
            >
              {t.home.heroSideText}
            </p>
            <div
              className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 motion-safe:animate-fade-up"
              style={{ animationDelay: '0.65s' }}
            >
              <Magnetic>
                <Link
                  href={`/${locale}/catalog`}
                  className="btn-forest group px-8 py-4 font-serif text-xl font-medium"
                >
                  {t.nav.goToCatalog}
                  <ArrowRightIcon
                    width={20}
                    height={20}
                    className="transition-transform group-hover:translate-x-1.5"
                  />
                </Link>
              </Magnetic>
              <Link
                href={`/${locale}/about`}
                className="relative pb-1 text-lg text-nk-ink after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-nk-gold after:transition-transform after:duration-500 hover:text-nk-forest hover:after:scale-x-[0.4]"
              >
                {t.nav.brand}
              </Link>
            </div>
            <ul className="mt-10 grid max-w-md grid-cols-3">
              {t.home.heroFeatures.map((feature, i) => (
                <li
                  key={feature}
                  className="group flex flex-col items-center gap-2 border-nk-gold/40 px-2 text-center text-[15px] leading-snug text-nk-ink motion-safe:animate-fade-up [&:not(:first-child)]:border-l"
                  style={{ animationDelay: `${0.8 + i * 0.12}s` }}
                >
                  <Icon
                    name={FEATURE_ICONS[i]}
                    className="h-10 w-10 text-[#B8893F] transition duration-500 group-hover:-translate-y-1 group-hover:scale-110"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* the categories under a gold line */}
      <nav className="container relative z-10 mt-8 lg:mt-2" aria-label={t.nav.catalog}>
        <span
          className="block h-px bg-gradient-to-r from-transparent via-nk-gold/70 to-transparent"
          aria-hidden
        />
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 py-4 sm:grid-cols-3 lg:grid-cols-5 lg:py-6">
          {shown.map((category, i) => (
            <li
              key={category.slug}
              className="motion-safe:animate-fade-up lg:border-nk-gold/40 lg:[&:not(:first-child)]:border-l"
              style={{ animationDelay: `${1 + i * 0.08}s` }}
            >
              <Link
                href={`/${locale}/catalog/${category.slug}`}
                className="group flex items-center gap-2.5 rounded-2xl px-2 py-2.5 font-serif text-[1rem] leading-tight text-nk-ink transition hover:bg-white/60 hover:text-nk-forest sm:text-[1.05rem] lg:justify-center lg:whitespace-nowrap lg:text-[1.08rem] xl:text-[1.15rem]"
              >
                <Icon
                  name={CATEGORY_ICONS[category.slug] ?? 'leaf'}
                  className="h-8 w-8 shrink-0 text-[#B8893F] transition duration-500 group-hover:-rotate-6 group-hover:scale-110 lg:h-10 lg:w-10"
                />
                <span className="min-w-0">{category.name}</span>
                <ArrowRightIcon
                  width={17}
                  height={17}
                  className="ml-1 shrink-0 transition group-hover:translate-x-1"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </HeroStage>
  );
}
