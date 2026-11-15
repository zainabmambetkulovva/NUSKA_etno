import type { Metadata } from 'next';

import { ContentPage } from '@/components/content/content-page';
import { getDictionary } from '@/i18n/get-dictionary';
import { alternates, resolveLocale } from '@/lib/locale-params';

/** Privacy policy. Text is managed in the admin panel (content key "page.privacy"). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return { title: t.footer.privacy, alternates: alternates(locale, '/privacy') };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return (
    <ContentPage
      locale={locale}
      t={t}
      contentKey="page.privacy"
      title={t.footer.privacy}
      fallbackBody={t.pages.pendingText}
    />
  );
}
