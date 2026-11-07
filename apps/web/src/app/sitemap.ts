import type { MetadataRoute } from 'next';

import type { CategoryNode, Page, ProductCard } from '@nuska/types';

import { locales } from '@/i18n/config';
import { serverApiSafe } from '@/lib/api/server';
import { siteUrl } from '@/lib/locale-params';

// Rendered on request (the API is not needed at build time), then cached for an hour.
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

function entry(path: string, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteUrl}/ky${path}`,
    priority,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${path}`])),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const empty: Page<ProductCard> = { data: [], meta: { total: 0, limit: 0, offset: 0 } };
  const [categories, products] = await Promise.all([
    serverApiSafe<CategoryNode[]>('/categories', 'ky', [], 3600),
    serverApiSafe<Page<ProductCard>>('/products?limit=100', 'ky', empty, 3600),
  ]);
  const flat: string[] = [];
  const walk = (nodes: CategoryNode[]) =>
    nodes.forEach((n) => (flat.push(n.slug), walk(n.children)));
  walk(categories);

  return [
    entry('', 1),
    entry('/catalog', 0.9),
    ...flat.map((slug) => entry(`/catalog/${slug}`, 0.8)),
    ...products.data.map((p) => entry(`/product/${p.slug}`, 0.7)),
    entry('/about', 0.5),
    entry('/pickup', 0.5),
    entry('/contacts', 0.5),
    entry('/traditions', 0.5),
    entry('/faq', 0.5),
    entry('/gift-builder', 0.6),
    entry('/assistant', 0.5),
    entry('/privacy', 0.2),
    entry('/terms', 0.2),
    entry('/order-terms', 0.2),
  ];
}
