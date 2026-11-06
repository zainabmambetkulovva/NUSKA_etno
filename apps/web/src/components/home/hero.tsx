import type { ProductCard } from '@nuska/types';

import { HeroScene } from './hero-scene';

import { KochkorMuyuz } from '@/components/brand/ornament';
import { ButtonLink } from '@/components/ui/button';
import { Parallax } from '@/components/ui/parallax';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';

export function Hero({
  locale,
  t,
  sceneProducts,
}: {
  locale: Locale;
  t: Dictionary;
  sceneProducts: ProductCard[];
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream-light via-cream-light to-milk">
      <Parallax speed={0.3}>
        <div className="bg-ornament absolute inset-0 opacity-60" />
      </Parallax>
      <div className="container relative grid items-center gap-10 py-12 md:py-20 lg:grid-cols-[1fr_1.1fr]">
        <div className="animate-fade-up space-y-6">
          <span className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cream-light md:tracking-[0.2em]">
            <KochkorMuyuz className="h-3 w-6 text-cream" />
            {t.home.heroEyebrow}
          </span>
          <h1 className="space-y-2">
            <span className="block font-serif text-5xl font-semibold tracking-tight text-brand md:text-7xl">
              NUSKA_etno
            </span>
            <span className="block text-3xl font-semibold leading-tight md:text-5xl">
              {t.home.heroTitle}
            </span>
          </h1>
          <p className="max-w-xl text-lg text-ink-muted">{t.home.heroText}</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/${locale}/catalog`} size="lg">
              {t.home.toCatalog}
            </ButtonLink>
            <ButtonLink href="#story" size="lg" variant="outline">
              {t.home.explore}
            </ButtonLink>
          </div>
          <p className="hidden text-sm text-ink-soft lg:block">↘ {t.home.sceneHint}</p>
        </div>
        <HeroScene products={sceneProducts} />
      </div>
      {/* Soft transition into the next section */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-milk"
        aria-hidden
      />
    </section>
  );
}
