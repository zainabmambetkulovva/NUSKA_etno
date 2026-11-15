import type { Metadata } from 'next';

import type { Page, ProductCard } from '@nuska/types';

import { OriginMap } from '@/components/home/origin-map';
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
  return {
    title: t.landing.originPageTitle,
    description: t.landing.originText,
    alternates: alternates(locale, '/origin'),
  };
}

/** «Из сердца Кыргызстана»: the full interactive map with the products of every region. */
export default async function OriginPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  const empty: Page<ProductCard> = { data: [], meta: { total: 0, limit: 0, offset: 0 } };
  const products = await serverApiSafe<Page<ProductCard>>('/products?limit=100', locale, empty);

  return (
    <div className="container py-12 lg:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-4xl text-nk-ink md:text-5xl">{t.landing.originPageTitle}</h1>
        <p className="mt-4 text-lg text-nk-muted">{t.landing.originText}</p>
      </header>
      <OriginMap products={products.data} className="mt-12" />
    </div>
  );
}
