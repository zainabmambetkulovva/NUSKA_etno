import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import type { SiteContent } from '@nuska/types';
import Image from 'next/image';
import Link from 'next/link';

import { KochkorMuyuz, OrnamentDivider } from '@/components/brand/ornament';
import { ButtonLink } from '@/components/ui/button';
import { DiamondIcon, LeafIcon, SproutIcon } from '@/components/ui/icons';
import { Reveal } from '@/components/ui/reveal';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { alternates, resolveLocale } from '@/lib/locale-params';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return { title: t.aboutPage.title, alternates: alternates(locale, '/about') };
}

const VALUE_ICONS: ReactNode[] = [
  <LeafIcon key="leaf" width={24} height={24} />,
  <DiamondIcon key="diamond" width={24} height={24} />,
  <SproutIcon key="sprout" width={24} height={24} />,
];

/**
 * «About us»: the company's own text (admin block "about"; the same text is the
 * built-in default), the brand pictures, what the company values and a closing line.
 */
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  const page = t.aboutPage;
  const content = await serverApiSafe<SiteContent | null>('/content/about', locale, null);

  const paragraphs = content?.body
    ? content.body
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : page.paragraphs;
  const [lead, ...rest] = paragraphs;
  const closing = rest.length > 1 ? rest[rest.length - 1] : null;
  const middle = closing ? rest.slice(0, -1) : rest;

  return (
    <>
      <section className="relative overflow-hidden bg-nk-cream py-14 lg:py-20">
        <div className="bg-ornament absolute inset-0 opacity-40" aria-hidden />
        <div className="container relative max-w-4xl space-y-6 text-center">
          <KochkorMuyuz className="mx-auto h-10 w-20 text-brand/70" animate />
          <h1 className="text-4xl font-semibold md:text-6xl">{content?.title || page.title}</h1>
          {lead && (
            <p className="font-serif text-xl leading-relaxed text-nk-ink md:text-3xl md:leading-snug">
              {lead}
            </p>
          )}
        </div>
      </section>

      <section className="container py-10 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <Reveal>
            <div className="grid grid-cols-5 gap-4">
              <div className="relative col-span-3 aspect-[4/5] overflow-hidden rounded-[2rem] border border-gold/40 shadow-lift">
                <Image
                  src="/images/home/cta.png"
                  alt={page.images.yurt}
                  fill
                  sizes="(min-width: 1024px) 330px, 55vw"
                  className="object-cover"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-4">
                <div className="relative flex-1 overflow-hidden rounded-[1.6rem] border border-gold/40 shadow-lift">
                  <Image
                    src="/images/home/about.png"
                    alt={page.images.meadow}
                    fill
                    sizes="(min-width: 1024px) 220px, 35vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative flex-1 overflow-hidden rounded-[1.6rem] border border-gold/40 shadow-lift">
                  <Image
                    src="/images/home/hero.png"
                    alt={page.images.scene}
                    fill
                    sizes="(min-width: 1024px) 220px, 35vw"
                    className="object-cover object-[30%_50%]"
                  />
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="space-y-5 text-lg leading-relaxed text-nk-muted">
              {middle.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container pb-10 lg:pb-16">
        <h2 className="text-center font-serif text-3xl text-nk-ink md:text-4xl">
          {page.valuesTitle}
        </h2>
        <ul className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-3">
          {page.values.map((value, i) => (
            <li key={value.title}>
              <Reveal delay={i * 0.07} className="h-full">
                <article className="card-hover h-full rounded-[1.6rem] border border-nk-beige bg-white/85 p-6 shadow-[0_18px_36px_-28px_rgba(80,60,30,0.6)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-nk-sage/70 text-nk-forest">
                    {VALUE_ICONS[i]}
                  </span>
                  <h3 className="mt-4 font-serif text-xl text-nk-ink">{value.title}</h3>
                  <p className="mt-2 leading-relaxed text-nk-muted">{value.text}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {closing && (
        <section className="container pb-16 lg:pb-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-nk-forest to-nk-night px-6 py-12 text-center sm:px-12 lg:px-16 lg:py-14 lg:text-left">
              <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(199,166,106,0.28),transparent_55%)]"
                aria-hidden
              />
              <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_260px]">
                <div>
                  <OrnamentDivider className="mb-6 hidden lg:block" />
                  <p className="font-serif text-2xl leading-snug text-[#F3EAD3] md:text-4xl md:leading-snug">
                    {closing}
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                    <ButtonLink href={`/${locale}/catalog`} variant="secondary" size="lg">
                      {t.home.toCatalog}
                    </ButtonLink>
                    <Link
                      href={`/${locale}/contacts`}
                      className="inline-flex h-12 items-center justify-center rounded-full border border-[#F3EAD3]/50 px-8 text-base font-medium text-[#F3EAD3] transition hover:bg-white/10"
                    >
                      {t.nav.contacts}
                    </Link>
                  </div>
                </div>
                <div className="relative mx-auto hidden aspect-[3/4] w-56 lg:block">
                  <Image
                    src="/images/home/brand-girl.webp"
                    alt={page.images.girl}
                    fill
                    sizes="260px"
                    className="object-contain object-bottom drop-shadow-[0_20px_24px_rgba(0,0,0,0.45)]"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}
