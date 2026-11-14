import type { Metadata } from 'next';

import { ContentPage } from '@/components/content/content-page';
import { getDictionary } from '@/i18n/get-dictionary';
import { alternates, resolveLocale } from '@/lib/locale-params';

/** Returns: published only after the company approves the terms. Text is managed in the admin panel (content key "page.returns"). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return { title: t.footer.returns, alternates: alternates(locale, '/returns') };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return (
    <ContentPage
      locale={locale}
      t={t}
      contentKey="page.returns"
      title={t.footer.returns}
      fallbackBody={t.pages.pendingText}
    />
  );
}
