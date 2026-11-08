import type { ProductCard } from '@nuska/types';
import Image from 'next/image';

import { HeroScene } from './hero-scene';

import { KochkorMuyuz } from '@/components/brand/ornament';
import { ButtonLink } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';

/**
 * Hero after the design reference: the company's picture (yurt, mountains and
 * a podium) as the background, the header floating over it, the title in the
 * sky and the 3D packages on the podium.
 */
export function Hero({
  locale,
  t,
  sceneProducts,
}: {
  locale: Locale;
  t: Dictionary;
  sceneProducts: ProductCard[];
}) {
  const content = (
    <>
      <span className="inline-flex items-center gap-2 rounded-full bg-brand/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream-light md:text-xs">
        <KochkorMuyuz className="h-3 w-6 text-cream" />
        {t.home.heroEyebrow}
      </span>
      <h1 className="space-y-1">
        <span className="block font-serif text-4xl font-semibold tracking-tight text-brand md:text-6xl">
          NUSKA_etno
        </span>
        <span className="block text-2xl font-semibold leading-tight text-ink md:text-4xl">
          {t.home.heroTitle}
        </span>
      </h1>
      <p className="max-w-xl text-ink-muted md:text-lg">{t.home.heroText}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href={`/${locale}/catalog`} size="lg">
          {t.home.toCatalog}
        </ButtonLink>
        <ButtonLink href="#story" size="lg" variant="outline" className="bg-cream-light/70">
          {t.home.explore}
        </ButtonLink>
      </div>
    </>
  );

  return (
    <section className="relative -mt-[72px] xl:-mt-[104px]">
      {/* Title: above the picture on phones, in its sky from tablets up (one copy in the DOM). */}
      <div className="relative bg-gradient-to-b from-cream-light to-[#EFE6C4] px-4 pb-6 pt-[92px] text-center md:absolute md:inset-x-0 md:top-[13%] md:z-10 md:bg-none md:p-0 md:px-6 xl:top-[15%]">
        <div className="flex animate-fade-up flex-col items-center gap-4">{content}</div>
      </div>
      {/* The picture keeps its proportions, so the podium is always under the 3D packages. */}
      <div className="relative mb-16 aspect-[1672/941] w-full md:mb-0">
        <Image
          src="/images/hero-bg.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 hidden h-[62%] bg-[radial-gradient(ellipse_50%_70%_at_50%_30%,rgba(251,246,227,0.92),rgba(251,246,227,0.55)_55%,transparent_80%)] md:block"
          aria-hidden
        />
        <HeroScene products={sceneProducts} />
      </div>
    </section>
  );
}
