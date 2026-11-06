import type { Metadata } from 'next';

import type { SiteContent } from '@nuska/types';

import { KochkorMuyuz, OrnamentDivider } from '@/components/brand/ornament';
import { StoryScene } from '@/components/home/story-scene';
import { ButtonLink } from '@/components/ui/button';
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
  return { title: t.pages.traditions.title, alternates: alternates(locale, '/traditions') };
}

/**
 * "Our traditions": general cultural notes about the Kyrgyz dastorkon. The
 * company can replace the text in the admin panel (content key "page.traditions").
 */
export default async function TraditionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  const content = await serverApiSafe<SiteContent | null>('/content/page.traditions', locale, null);
  const page = t.pages.traditions;

  return (
    <>
      <section className="relative overflow-hidden bg-cream-light py-14">
        <div className="bg-ornament absolute inset-0 opacity-50" aria-hidden />
        <div className="container relative max-w-3xl space-y-4 text-center">
          <KochkorMuyuz className="mx-auto h-10 w-20 text-brand/70" animate />
          <h1 className="text-4xl font-semibold md:text-6xl">{content?.title || page.title}</h1>
          <p className="text-lg text-ink-muted">{page.lead}</p>
        </div>
      </section>
      <section className="section container">
        <Reveal>
          <StoryScene label={t.home.storySceneLabel} />
        </Reveal>
        {content?.body ? (
          <div className="mx-auto mt-12 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-ink-muted">
            {content.body}
          </div>
        ) : (
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
            {page.sections.map((s, i) => (
              <Reveal key={s.title} delay={(i % 2) * 0.08}>
                <article className="card h-full space-y-3 p-6">
                  <h2 className="flex items-center gap-3 font-serif text-2xl text-brand">
                    <KochkorMuyuz className="h-4 w-8 text-gold" /> {s.title}
                  </h2>
                  <p className="leading-relaxed text-ink-muted">{s.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        )}
        <OrnamentDivider className="my-12" />
        <div className="text-center">
          <ButtonLink href={`/${locale}/catalog`} size="lg">
            {t.home.toCatalog}
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
