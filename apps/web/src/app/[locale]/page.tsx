import type { Page, ProductCard as ProductCardData, SiteContent } from '@nuska/types';

import { Hero } from '@/components/home/hero';
import {
  ClosingCta,
  PricesPodium,
  ProductsRow,
  Promises,
  Story,
  WhyUs,
} from '@/components/home/sections';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { resolveLocale } from '@/lib/locale-params';

/**
 * Home page after the company's design, top to bottom: hero → why us →
 * our prices (podium) → about us → our products → promises → closing call.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);

  const empty: Page<ProductCardData> = { data: [], meta: { total: 0, limit: 0, offset: 0 } };
  const [products, contacts] = await Promise.all([
    serverApiSafe<Page<ProductCardData>>('/products?limit=100', locale, empty),
    serverApiSafe<SiteContent | null>('/content/contacts', locale, null),
  ]);
  const youtube = contacts?.data?.youtube;
  const videoUrl =
    typeof youtube === 'string' && /^https:\/\//.test(youtube.trim()) ? youtube.trim() : null;

  return (
    <>
      <Hero locale={locale} t={t} />
      <WhyUs t={t} />
      <PricesPodium t={t} locale={locale} products={products.data} />
      <Story t={t} locale={locale} videoUrl={videoUrl} />
      <ProductsRow t={t} locale={locale} products={products.data} />
      <Promises t={t} />
      <ClosingCta t={t} locale={locale} />
    </>
  );
}
