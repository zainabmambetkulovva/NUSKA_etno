import { Suspense } from 'react';

import type { CategoryNode, Page, ProductCard as ProductCardData } from '@nuska/types';
import Link from 'next/link';

import { CatalogFilters } from './catalog-filters';

import { ProductCard } from '@/components/product/product-card';
import { buttonClass } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { serverApi, serverApiSafe } from '@/lib/api/server';

export const PAGE_SIZE = 12;
const SORTS = new Set(['default', 'popular', 'price_asc', 'price_desc', 'newest']);

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Shared by /catalog and /catalog/[category]. Data is rendered on the server (SEO, caching). */
export async function CatalogView({
  locale,
  t,
  searchParams,
  category,
}: {
  locale: Locale;
  t: Dictionary;
  searchParams: CatalogSearchParams;
  category?: CategoryNode | null;
}) {
  const page = Math.max(1, Number(first(searchParams.page)) || 1);
  const query = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String((page - 1) * PAGE_SIZE),
  });
  const search = first(searchParams.search)?.slice(0, 100);
  const sort = first(searchParams.sort);
  if (search) query.set('search', search);
  if (sort && SORTS.has(sort)) query.set('sort', sort);
  if (first(searchParams.inStock) === 'true') query.set('inStock', 'true');
  if (category) query.set('category', category.slug);

  const [categories, products] = await Promise.all([
    serverApiSafe<CategoryNode[]>('/categories', locale, []),
    serverApi<Page<ProductCardData>>(`/products?${query.toString()}`, locale),
  ]);
  const pages = Math.max(1, Math.ceil(products.meta.total / PAGE_SIZE));
  const pageHref = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams))
      if (first(v) && k !== 'page') next.set(k, first(v)!);
    if (p > 1) next.set('page', String(p));
    const qs = next.toString();
    return `/${locale}/catalog${category ? `/${category.slug}` : ''}${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="container py-10">
      <nav className="mb-4 text-sm text-ink-soft" aria-label="breadcrumbs">
        <Link href={`/${locale}`} className="hover:text-brand">
          {t.nav.home}
        </Link>{' '}
        /{' '}
        <Link href={`/${locale}/catalog`} className="hover:text-brand">
          {t.catalog.title}
        </Link>
        {category && (
          <>
            {' '}
            / <span className="text-ink">{category.name}</span>
          </>
        )}
      </nav>
      <h1 className="mb-2 text-4xl font-semibold">{category?.name ?? t.catalog.title}</h1>
      {category?.description && (
        <p className="mb-6 max-w-2xl text-ink-muted">{category.description}</p>
      )}
      <p className="mb-8 text-sm text-ink-soft">
        {t.catalog.results}: {products.meta.total}
      </p>

      <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
        <Suspense>
          <CatalogFilters categories={categories} activeCategory={category?.slug} />
        </Suspense>
        <div>
          {products.data.length === 0 ? (
            <EmptyState
              title={t.catalog.empty}
              action={
                <Link href={`/${locale}/catalog`} className={buttonClass('outline', 'sm')}>
                  {t.catalog.clearFilters}
                </Link>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.data.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 3} />
              ))}
            </div>
          )}
          {pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="pagination">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className={buttonClass('outline', 'sm')}>
                  {t.common.prev}
                </Link>
              )}
              <span className="px-3 text-sm text-ink-muted">
                {page} / {pages}
              </span>
              {page < pages && (
                <Link href={pageHref(page + 1)} className={buttonClass('outline', 'sm')}>
                  {t.common.next}
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
