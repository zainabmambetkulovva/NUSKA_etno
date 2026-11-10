import Image from 'next/image';
import Link from 'next/link';

import { Leaf, Wave } from '@/components/brand/kyrgyz-decor';
import { LogoMark } from '@/components/brand/logo';
import { ArrowRightIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';

/**
 * First screen after the company's design: the dastorkon scene (jar, butter,
 * bowl, yurt, horse, Tian Shan) fills the screen, the slogan and the catalog
 * button stand on its dark green left side. It slides under the header, which
 * stays transparent over it. On phones the scene is on top, the text below.
 */
export function Hero({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <section
      className="relative -mt-[68px] overflow-hidden bg-[#182B15] lg:-mt-[76px]"
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-x-0 top-0 h-[390px] sm:h-[480px] lg:inset-0 lg:h-auto">
        <Image
          src="/images/home/hero.webp"
          alt={t.home.heroImageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 100vw, 170vw"
          className="object-cover object-[80%_center] motion-safe:animate-ken-burns lg:object-center"
        />
      </div>
      {/* phone: the scene melts into the dark green text block */}
      <div
        className="absolute inset-x-0 top-0 h-[390px] bg-gradient-to-b from-[#182B15]/80 via-transparent via-30% to-[#182B15] sm:h-[480px] lg:hidden"
        aria-hidden
      />
      {/* desktop: darker top for the header and a calm left side for the text */}
      <div
        className="absolute inset-0 hidden bg-[linear-gradient(to_bottom,rgba(20,36,17,0.75),transparent_22%),linear-gradient(to_right,rgba(20,36,17,0.55),transparent_48%)] lg:block"
        aria-hidden
      />

      <div className="container relative flex flex-col pb-24 pt-[400px] sm:pt-[490px] lg:h-[clamp(560px,60.3vw,900px)] lg:justify-center lg:pb-[8%] lg:pt-[76px]">
        <div className="max-w-xl motion-safe:animate-fade-up">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.35em] text-[#E7C77F]">
            <span className="h-px w-6 bg-[#E7C77F]/60" aria-hidden />
            NUSKA_etno
            <span className="h-px w-10 bg-[#E7C77F]/60" aria-hidden />
          </p>
          <h1
            id="hero-title"
            className="mt-4 font-serif text-[clamp(2.25rem,4.7vw,4.5rem)] font-medium leading-[1.08] tracking-tight [text-shadow:0_2px_18px_rgba(10,22,8,0.6)]"
          >
            <span className="block text-[#FAF3DF]">{t.home.heroTitle}</span>{' '}
            <span className="block text-[#E7C77F]">{t.home.heroTitleAccent}</span>
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-[#FAF3DF]/90 sm:text-lg lg:text-[clamp(1rem,1.45vw,1.3rem)]">
            {t.home.heroText}
          </p>
          <Link
            href={`/${locale}/catalog`}
            className="btn-gold mt-8 px-8 py-4 text-[15px] lg:text-[clamp(0.95rem,1.15vw,1.1rem)]"
          >
            {t.nav.goToCatalog}
            <ArrowRightIcon width={18} height={18} />
          </Link>
        </div>
      </div>

      <Wave className="absolute inset-x-0 -bottom-px h-12 text-[#EAD5AE] sm:h-20" />
      <LogoMark className="absolute -left-5 bottom-2 h-20 w-20 opacity-90 sm:h-24 sm:w-24" />
      <Leaf className="absolute bottom-6 right-6 h-10 w-16 [--sway-from:150deg] [--sway-to:162deg] sm:right-12" />
    </section>
  );
}
