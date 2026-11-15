import type { CategoryNode, Page, ProductCard as ProductCardData, SiteContent } from '@nuska/types';

import { Hero } from '@/components/home/hero';
import {
  BenefitsBar,
  BrandAbout,
  CategoryArches,
  OriginAndBestsellers,
} from '@/components/home/landing';
import {
  ClosingCta,
  PricesPodium,
  ProductsRow,
  Promises,
  Story,
  WhyUs,
} from '@/components/home/sections';
import { HoneyDivider } from '@/components/motion/honey-divider';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { resolveLocale } from '@/lib/locale-params';

/**
 * Home page after the NUSKA_etno mockup: hero → benefits → categories → about
 * the brand → origin map and bestsellers. Below them the earlier home blocks
 * the company asked to keep: why us → prices (podium) → story → products →
 * promises → closing call.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);

  const empty: Page<ProductCardData> = { data: [], meta: { total: 0, limit: 0, offset: 0 } };
  const [products, popular, categories, contacts] = await Promise.all([
    serverApiSafe<Page<ProductCardData>>('/products?limit=100', locale, empty),
    serverApiSafe<Page<ProductCardData>>('/products?sort=popular&limit=12', locale, empty),
    serverApiSafe<CategoryNode[]>('/categories', locale, []),
    serverApiSafe<SiteContent | null>('/content/contacts', locale, null),
  ]);
  const youtube = contacts?.data?.youtube;
  const videoUrl =
    typeof youtube === 'string' && /^https:\/\//.test(youtube.trim()) ? youtube.trim() : null;
  // products the admin marked as featured come first, then the most ordered ones
  const bestsellers = [...popular.data].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

  return (
    <>
      <Hero locale={locale} t={t} videoUrl={videoUrl} />
      <BenefitsBar t={t} />
      <CategoryArches t={t} locale={locale} categories={categories} />
      <HoneyDivider className="-my-4" />
      <BrandAbout t={t} locale={locale} />
      <OriginAndBestsellers
        t={t}
        locale={locale}
        products={products.data}
        bestsellers={bestsellers}
      />
      <HoneyDivider className="my-2" />
      <WhyUs t={t} />
      <PricesPodium t={t} locale={locale} products={products.data} />
      <Story t={t} locale={locale} videoUrl={videoUrl} />
      <ProductsRow t={t} locale={locale} products={products.data} />
      <Promises t={t} />
      <ClosingCta t={t} locale={locale} />
    </>
  );
}
