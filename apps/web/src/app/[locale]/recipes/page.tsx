import type { Metadata } from 'next';

import type { Page, ProductCard } from '@nuska/types';
import Image from 'next/image';
import Link from 'next/link';

import { ClockIcon } from '@/components/ui/icons';
import { Reveal } from '@/components/ui/reveal';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { alternates, resolveLocale } from '@/lib/locale-params';
import { companyPhoto } from '@/lib/product-photos';

const DISH_PHOTOS: Record<string, string> = {
  'besh-barmak': '/images/dishes/besh-barmak.png',
  bal: '/images/dishes/bal.png',
  navat: '/images/dishes/navat.png',
  kymyz: '/images/dishes/kymyz.png',
  'sary-mai': '/images/dishes/sary-mai.png',
  zhupka: '/images/dishes/zhupka.png',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return {
    title: t.recipesPage.title,
    description: t.recipesPage.lead,
    alternates: alternates(locale, '/recipes'),
  };
}

/**
 * Recipes: traditional Kyrgyz dishes made with the store's products. Each
 * recipe links its products to the catalog. Photos of the dishes are the
 * company's product photos until recipe photos are added.
 */
export default async function RecipesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  const empty: Page<ProductCard> = { data: [], meta: { total: 0, limit: 0, offset: 0 } };
  const products = await serverApiSafe<Page<ProductCard>>('/products?limit=100', locale, empty);
  const page = t.recipesPage;

  const productLink = (key: string) => {
    const product = products.data
      .filter((p) => p.slug === key || p.slug.startsWith(`${key}-`))
      .sort((a, b) => a.price.amount - b.price.amount)[0];
    const name = t.landing.productNames[key as keyof typeof t.landing.productNames] ?? key;
    return {
      key,
      name: product?.name.replace(/\s+\d+([.,]\d+)?$/, '') ?? name,
      href: product
        ? `/${locale}/product/${product.slug}`
        : `/${locale}/search?q=${encodeURIComponent(name)}`,
    };
  };

  return (
    <div className="container py-12 lg:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-4xl text-nk-ink md:text-5xl">{page.title}</h1>
        <p className="mt-4 text-lg text-nk-muted">{page.lead}</p>
      </header>

      <nav
        className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2"
        aria-label={page.title}
      >
        {page.items.map((recipe) => (
          <a
            key={recipe.slug}
            href={`#${recipe.slug}`}
            className="rounded-full border border-nk-beige bg-white px-4 py-2 text-sm text-nk-ink transition hover:border-nk-gold hover:text-nk-forest"
          >
            {recipe.title}
          </a>
        ))}
      </nav>

      <div className="mx-auto mt-12 max-w-5xl space-y-10">
        {page.items.map((recipe) => {
          const photo = DISH_PHOTOS[recipe.products[0]] ?? companyPhoto(recipe.products[0]) ?? null;
          return (
            <Reveal key={recipe.slug}>
              <article
                id={recipe.slug}
                className="grid scroll-mt-28 gap-6 overflow-hidden rounded-[2rem] border border-nk-beige bg-white/85 p-6 shadow-[0_24px_48px_-34px_rgba(80,60,30,0.7)] md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:p-8"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[radial-gradient(ellipse_at_50%_60%,#FFF8EA,#F0D9B0)]">
                  {photo && (
                    <Image
                      src={photo}
                      alt=""
                      fill
                      quality={95}
                      sizes="(min-width: 768px) 400px, 90vw"
                      className="object-contain p-4"
                    />
                  )}
                </div>
                <div>
                  <h2 className="font-serif text-3xl text-nk-ink">{recipe.title}</h2>
                  <p className="mt-2 text-nk-muted">{recipe.text}</p>
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-nk-brown">
                    <ClockIcon width={16} height={16} />
                    {page.time}: {recipe.time}
                  </p>
                  <div className="mt-5 grid gap-6 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-nk-forest">
                        {page.ingredients}
                      </h3>
                      <ul className="mt-2 space-y-1.5 text-[15px] text-nk-ink">
                        {recipe.ingredients.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nk-gold" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-nk-forest">
                        {page.steps}
                      </h3>
                      <ol className="mt-2 space-y-2 text-[15px] text-nk-ink">
                        {recipe.steps.map((step, i) => (
                          <li key={step} className="flex gap-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nk-forest text-xs font-semibold text-white">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-nk-beige pt-4">
                    <span className="text-sm text-nk-muted">{page.products}:</span>
                    {recipe.products.map(productLink).map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        className="rounded-full bg-nk-sage/70 px-3.5 py-1.5 text-sm font-medium text-nk-forest transition hover:bg-nk-forest hover:text-white"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
