import type { Metadata } from 'next';

import type { CategoryNode } from '@nuska/types';
import { notFound } from 'next/navigation';

import { CatalogView, type CatalogSearchParams } from '@/components/catalog/catalog-view';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiOrNull } from '@/lib/api/server';
import { alternates, resolveLocale } from '@/lib/locale-params';

type Params = Promise<{ locale: string; category: string }>;

async function load(params: Params) {
  const locale = await resolveLocale(params);
  const { category: slug } = await params;
  const category = await serverApiOrNull<CategoryNode>(
    `/categories/${encodeURIComponent(slug)}`,
    locale
  );
  if (!category) notFound();
  return { locale, category };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, category } = await load(params);
  return {
    title: category.name,
    description: category.description ?? undefined,
    alternates: alternates(locale, `/catalog/${category.slug}`),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const { locale, category } = await load(params);
  const t = await getDictionary(locale);
  return (
    <CatalogView locale={locale} t={t} searchParams={await searchParams} category={category} />
  );
}
