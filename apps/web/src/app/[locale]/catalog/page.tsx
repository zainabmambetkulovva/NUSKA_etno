import type { Metadata } from 'next';

import { CatalogView, type CatalogSearchParams } from '@/components/catalog/catalog-view';
import { getDictionary } from '@/i18n/get-dictionary';
import { alternates, resolveLocale } from '@/lib/locale-params';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return { title: t.catalog.title, alternates: alternates(locale, '/catalog') };
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return <CatalogView locale={locale} t={t} searchParams={await searchParams} />;
}
