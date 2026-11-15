import type { Metadata } from 'next';

import { ContentPage } from '@/components/content/content-page';
import { getDictionary } from '@/i18n/get-dictionary';
import { alternates, resolveLocale } from '@/lib/locale-params';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return { title: t.nav.pickup, alternates: alternates(locale, '/pickup') };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return (
    <ContentPage
      locale={locale}
      t={t}
      contentKey="pickup"
      title={t.nav.pickup}
      fallbackBody={t.home.pickupText}
      showPickup
    />
  );
}
