import Link from 'next/link';

import { HeroPodium } from './hero-podium';

import { Leaf, MountainSilhouettes, OrnamentCorner, Wave } from '@/components/brand/kyrgyz-decor';
import { ArrowRightIcon, GiftIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';

/**
 * First screen: the brand name, slogan and buttons on the left, and on the
 * right the real 3D composition (carved wooden podium with honey, navat,
 * kymyz and other products) turning slowly to the left. Deep green sky with
 * the Tian Shan silhouettes, gold Kyrgyz corner ornaments, swaying leaves.
 * It slides under the header, which stays transparent over it.
 */
export function Hero({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <section
      className="relative -mt-[68px] overflow-hidden bg-forest-dark lg:-mt-[76px]"
      aria-labelledby="hero-title"
    >
      {/* Deep green sky, a warm glow behind the podium and the Tian Shan silhouettes */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_68%_58%,rgba(214,173,98,0.28),transparent_45%),radial-gradient(ellipse_at_70%_40%,#3B6B3A_0%,#1E3A23_45%,#0F2112_100%)]"
        aria-hidden
      />
      <MountainSilhouettes className="absolute inset-x-0 bottom-0 h-[260px] w-full opacity-80" />
      <HeroPodium
        label={t.home.heroImageAlt}
        className="absolute inset-x-0 top-[64px] h-[380px] sm:h-[460px] lg:inset-y-0 lg:left-[38%] lg:right-0 lg:top-[40px] lg:h-auto"
      />

      <OrnamentCorner className="absolute -left-3 top-14 hidden h-36 w-36 text-honey/70 lg:block" />
      <OrnamentCorner className="absolute -bottom-3 -left-3 hidden h-36 w-36 -scale-y-100 text-honey/60 lg:block" />
      <Leaf className="absolute -left-4 top-[46%] hidden h-14 w-24 [--sway-from:-24deg] [--sway-to:-14deg] md:block" />
      <Leaf
        className="absolute right-6 top-24 hidden h-10 w-16 [--sway-from:150deg] [--sway-to:160deg] lg:block"
        style={{ animationDelay: '-3s' }}
      />

      <div className="container relative flex flex-col pb-20 pt-[420px] sm:pt-[500px] lg:min-h-[620px] lg:justify-center lg:pb-24 lg:pt-32">
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

      <Wave className="absolute inset-x-0 -bottom-px text-forest" />
    </section>
  );
}
