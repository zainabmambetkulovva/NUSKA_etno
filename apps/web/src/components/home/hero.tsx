import { HeroScene } from './hero-scene';

import { ButtonLink } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';

export function Hero({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream-light to-milk">
      <div className="bg-ornament pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="container relative grid items-center gap-10 py-12 md:py-20 lg:grid-cols-2">
        <div className="animate-fade-up space-y-6">
          <span className="inline-block rounded-md bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cream-light">
            NUSKA_etno
          </span>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            {t.home.heroTitle}
          </h1>
          <p className="max-w-xl text-lg text-ink-muted">{t.home.heroText}</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/${locale}/catalog`} size="lg">
              {t.home.toCatalog}
            </ButtonLink>
            <ButtonLink href={`/${locale}/about`} size="lg" variant="outline">
              {t.home.philosophy}
            </ButtonLink>
          </div>
        </div>
        <HeroScene />
      </div>
    </section>
  );
}
