import type { Metadata } from 'next';

import { ContentPage } from '@/components/content/content-page';
import { getDictionary } from '@/i18n/get-dictionary';
import { alternates, resolveLocale } from '@/lib/locale-params';

/** Order terms. Text is managed in the admin panel (content key "page.order-terms"). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return { title: t.footer.orderTerms, alternates: alternates(locale, '/order-terms') };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return (
    <ContentPage
      locale={locale}
      t={t}
      contentKey="page.order-terms"
      title={t.footer.orderTerms}
      fallbackBody={t.pages.pendingText}
    />
  );
}
