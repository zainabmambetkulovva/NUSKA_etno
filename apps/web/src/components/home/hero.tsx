import Image from 'next/image';
import Link from 'next/link';

import { Leaf, OrnamentCorner, Wave } from '@/components/brand/kyrgyz-decor';
import { ArrowRightIcon, GiftIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';

/**
 * First screen of the design: the dastorkon with butter, zhupka, kurut and
 * kymyz in front of a yurt and the Tian Shan, the deep green panel with the
 * brand name on the left, gold Kyrgyz corner ornaments and swaying leaves.
 * It slides under the header, which stays transparent over it.
 */
export function Hero({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <section
      className="relative -mt-[68px] overflow-hidden bg-forest-dark lg:-mt-[76px]"
      aria-labelledby="hero-title"
    >
      {/* Phone: the picture on top, the text below it. Desktop: the picture on the right. */}
      <div className="absolute inset-x-0 top-0 h-[400px] sm:h-[480px] lg:inset-y-0 lg:left-[26%] lg:h-auto">
        <Image
          src="/images/home/hero.webp"
          alt={t.home.heroImageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 74vw, 100vw"
          className="object-cover object-[30%_center] motion-safe:animate-ken-burns"
        />
      </div>
      <div
        className="absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-forest-dark/80 via-transparent to-forest-dark sm:h-[480px] lg:hidden"
        aria-hidden
      />
      <div
        className="absolute inset-0 hidden bg-gradient-to-r from-forest-dark from-[25%] via-forest-dark/55 via-[34%] to-transparent to-[46%] lg:block"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 top-0 hidden h-36 bg-gradient-to-b from-forest-dark/70 to-transparent lg:block"
        aria-hidden
      />

      <OrnamentCorner className="absolute -left-3 top-14 hidden h-36 w-36 text-honey/70 lg:block" />
      <OrnamentCorner className="absolute -bottom-3 -left-3 hidden h-36 w-36 -scale-y-100 text-honey/60 lg:block" />
      <Leaf className="absolute -left-4 top-[46%] hidden h-14 w-24 [--sway-from:-24deg] [--sway-to:-14deg] md:block" />
      <Leaf
        className="absolute right-6 top-24 hidden h-10 w-16 [--sway-from:150deg] [--sway-to:160deg] lg:block"
        style={{ animationDelay: '-3s' }}
      />

      <div className="container relative flex flex-col pb-20 pt-[330px] sm:pt-[400px] lg:min-h-[620px] lg:justify-center lg:pb-24 lg:pt-32">
        <div className="max-w-lg motion-safe:animate-fade-up [text-shadow:0_2px_12px_rgba(10,25,12,0.55)]">
          <p className="mb-4 text-sm font-medium tracking-wide text-honey-light sm:text-base">
            {t.home.heroEyebrow}
          </p>
          <h1 id="hero-title">
            <span className="block font-serif text-5xl font-medium leading-none tracking-tight text-cream-light drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] sm:text-7xl lg:text-[5.5rem]">
              NUSKA_etno
            </span>
            <span className="mt-4 block font-serif text-[1.75rem] font-normal leading-tight text-cream-light sm:text-4xl">
              {t.home.heroTitle}
            </span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-cream-light/85 sm:text-lg">
            {t.home.heroText}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href={`/${locale}/catalog`} className="btn-gold px-7 py-3.5 text-[15px]">
              {t.nav.goToCatalog}
              <ArrowRightIcon width={18} height={18} />
            </Link>
            <Link
              href={`/${locale}/gift-builder`}
              className="group inline-flex items-center gap-3 text-sm font-medium text-cream-light"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-light text-forest shadow-lg transition group-hover:scale-110 group-hover:bg-honey-light">
                <GiftIcon width={20} height={20} />
              </span>
              <span className="max-w-[7rem] leading-tight">{t.home.heroGift}</span>
            </Link>
          </div>
        </div>
      </div>

      <Wave className="absolute inset-x-0 -bottom-px text-sand" />
    </section>
  );
}
