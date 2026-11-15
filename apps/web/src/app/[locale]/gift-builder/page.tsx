import type { Metadata } from 'next';

import { KochkorMuyuz } from '@/components/brand/ornament';
import { GiftBuilder } from '@/components/gift/gift-builder';
import { getDictionary } from '@/i18n/get-dictionary';
import { alternates, resolveLocale } from '@/lib/locale-params';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return {
    title: t.gift.title,
    description: t.gift.lead,
    alternates: alternates(locale, '/gift-builder'),
  };
}

export default async function GiftBuilderPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return (
    <div className="container py-10">
      <div className="mx-auto mb-10 max-w-3xl space-y-4 text-center">
        <KochkorMuyuz className="mx-auto h-10 w-20 text-brand/70" animate />
        <h1 className="text-4xl font-semibold md:text-5xl">{t.gift.title}</h1>
        <p className="text-lg text-ink-muted">{t.gift.lead}</p>
      </div>
      <GiftBuilder />
    </div>
  );
}
