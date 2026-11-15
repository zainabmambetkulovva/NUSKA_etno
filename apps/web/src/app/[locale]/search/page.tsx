import type { Metadata } from 'next';

import type { Page, ProductCard as ProductCardData } from '@nuska/types';

import { SearchBox } from '@/components/catalog/search-box';
import { ProductCard } from '@/components/product/product-card';
import { ButtonLink } from '@/components/ui/button';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { resolveLocale } from '@/lib/locale-params';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  // Search results are not indexed.
  return { title: t.search.title, robots: { index: false, follow: true } };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 100) ?? '';
  const empty: Page<ProductCardData> = { data: [], meta: { total: 0, limit: 0, offset: 0 } };
  const results = q
    ? await serverApiSafe<Page<ProductCardData>>(
        `/products?search=${encodeURIComponent(q)}&limit=48`,
        locale,
        empty
      )
    : empty;

  return (
    <div className="container py-10">
      <div className="mx-auto mb-10 max-w-2xl space-y-6 text-center">
        <h1 className="text-4xl font-semibold">{t.search.title}</h1>
        <SearchBox key={q} initial={q} />
      </div>
      {!q ? (
        <p className="text-center text-ink-soft">{t.search.start}</p>
      ) : results.data.length === 0 ? (
        <div className="space-y-4 py-10 text-center">
          <p className="font-serif text-xl">{t.search.empty}</p>
          <p className="text-ink-soft">{t.search.emptyHint}</p>
          <ButtonLink href={`/${locale}/catalog`} variant="outline">
            {t.home.toCatalog}
          </ButtonLink>
        </div>
      ) : (
        <>
          <p className="mb-6 text-ink-muted">
            {t.search.results} «{q}»: {results.meta.total}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {results.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
