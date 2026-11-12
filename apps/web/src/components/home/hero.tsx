import Image from 'next/image';
import Link from 'next/link';

import { Wave } from '@/components/brand/kyrgyz-decor';
import { ArrowRightIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';

/**
 * First screen: the company's picture (the NUSKA logo above a yurt, horses in
 * a mountain valley, curd and a bowl of milk), used as sent. The slogan, the
 * text and the catalog button stand on its left side over a dark green veil.
 * The picture starts below the header strip, so the logo painted in it is
 * never covered by the menu. On phones the picture is on top, the text below.
 */
export function Hero({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <section
      className="relative -mt-[68px] overflow-hidden bg-[#182B15] lg:-mt-[76px] lg:h-[clamp(560px,calc(56.28vw+76px),980px)]"
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-x-0 top-[68px] h-[360px] sm:h-[440px] lg:bottom-0 lg:top-[76px] lg:h-auto">
        <Image
          src="/images/home/hero.png"
          alt={t.home.heroImageAlt}
          fill
          priority
          quality={95}
          sizes="(min-width: 1024px) 100vw, 640px"
          className="object-cover object-[50%_30%] motion-safe:animate-ken-burns lg:object-center"
        />
      </div>
      {/* phone: the picture melts into the dark green text block */}
      <div
        className="absolute inset-x-0 top-[68px] h-[360px] bg-gradient-to-b from-transparent from-55% to-[#182B15] sm:h-[440px] lg:hidden"
        aria-hidden
      />
      {/* desktop: a dark green veil on the left, under the text */}
      <div
        className="absolute inset-x-0 bottom-0 top-[76px] hidden bg-[linear-gradient(to_right,rgba(16,30,13,0.86)_0%,rgba(16,30,13,0.68)_26%,rgba(16,30,13,0.22)_42%,transparent_50%),linear-gradient(to_top,rgba(16,30,13,0.55),transparent_35%)] lg:block"
        aria-hidden
      />

      <div className="container relative flex flex-col pb-24 pt-[430px] sm:pt-[510px] lg:h-full lg:justify-end lg:pb-[calc(3.5vw+2.5rem)] lg:pt-[76px]">
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
          <p className="mt-5 max-w-sm text-base leading-relaxed text-[#FAF3DF]/90 [text-shadow:0_1px_10px_rgba(10,22,8,0.7)] sm:text-lg lg:text-[clamp(1rem,1.45vw,1.3rem)]">
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

      <Wave className="absolute inset-x-0 -bottom-px h-8 text-[#EAD5AE] sm:h-10" />
    </section>
  );
}
