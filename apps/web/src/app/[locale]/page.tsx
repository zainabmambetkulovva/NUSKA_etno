import type { CategoryNode, Page, ProductCard as ProductCardData } from '@nuska/types';

import { Hero } from '@/components/home/hero';
import {
  BenefitsBar,
  BrandAbout,
  CategoryArches,
  OriginAndBestsellers,
} from '@/components/home/landing';
import { ClosingCta, Promises, Story, WhyUs } from '@/components/home/sections';
import { HoneyDivider } from '@/components/motion/honey-divider';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { resolveLocale } from '@/lib/locale-params';

/**
 * Home page after the NUSKA_etno mockups: hero → «01 / Our story» → benefits →
 * categories → origin map and «Our products» (every product). Below them the
 * earlier blocks the company asked to keep: why us → story → promises →
 * closing call.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);

  const empty: Page<ProductCardData> = { data: [], meta: { total: 0, limit: 0, offset: 0 } };
  const [products, categories] = await Promise.all([
    serverApiSafe<Page<ProductCardData>>('/products?limit=100', locale, empty),
    serverApiSafe<CategoryNode[]>('/categories', locale, []),
  ]);
  // «Our products»: every product, kymyz, sary mai, honey and beshbarmak first
  const FIRST = ['kymyz', 'sary-mai', 'bal', 'besh-barmak'];
  const rank = (slug: string) => {
    const i = FIRST.findIndex((key) => slug === key || slug.startsWith(`${key}-`));
    return i === -1 ? FIRST.length : i;
  };
  const ourProducts = [...products.data].sort((a, b) => rank(a.slug) - rank(b.slug));

  return (
    <>
      <Hero locale={locale} t={t} categories={categories} />
      <BrandAbout t={t} locale={locale} />
      <BenefitsBar t={t} />
      <CategoryArches t={t} locale={locale} categories={categories} />
      <HoneyDivider className="-my-4" />
      <OriginAndBestsellers
        t={t}
        locale={locale}
        products={products.data}
        bestsellers={ourProducts}
      />
      <HoneyDivider className="my-2" />
      <WhyUs t={t} />
      <Story t={t} locale={locale} />
      <Promises t={t} />
      <ClosingCta t={t} locale={locale} />
    </>
  );
}
