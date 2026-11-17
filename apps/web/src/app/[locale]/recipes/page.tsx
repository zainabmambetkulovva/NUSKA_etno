import type { Metadata } from 'next';

import type { Page, ProductCard } from '@nuska/types';
import Link from 'next/link';

import { DISH_LAYERS } from '@/components/recipes/dish-layers';
import { DishVisual } from '@/components/recipes/dish-visual';
import { ClockIcon } from '@/components/ui/icons';
import { Reveal } from '@/components/ui/reveal';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { alternates, resolveLocale } from '@/lib/locale-params';

/** Three soft wavy lines under the slogan of a recipe. */
function Waves() {
  return (
    <svg
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      className="absolute inset-x-0 top-1/2 h-14 w-full -translate-y-1/2 text-nk-gold/25"
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M0 ${18 + i * 12} C 150 ${4 + i * 12}, 300 ${32 + i * 12}, 450 ${18 + i * 12} S 750 ${4 + i * 12}, 900 ${18 + i * 12} S 1100 ${32 + i * 12}, 1200 ${18 + i * 12}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

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
 * Recipes: traditional Kyrgyz dishes made with the store's products. Every
 * recipe is a dark panel: the dish taken apart in 3D with the name of each
 * part, a card with the steps, and a short slogan over wavy lines. The
 * recipe's products link to the catalog.
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

      <div className="mx-auto mt-12 max-w-6xl space-y-12">
        {page.items.map((recipe) => (
          <Reveal key={recipe.slug}>
            <article
              id={recipe.slug}
              aria-labelledby={`${recipe.slug}-title`}
              className="relative scroll-mt-28 overflow-hidden rounded-[2rem] bg-nk-night text-nk-cream shadow-[0_40px_80px_-50px_rgba(34,57,42,0.9)]"
            >
              <div className="grid gap-4 p-3 sm:p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-6 lg:p-7">
                {/* the dish taken apart */}
                <section className="relative flex min-h-[27rem] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(ellipse_at_50%_45%,#355B3E_0%,#2A4831_45%,#1B2E21_100%)] p-5 sm:min-h-[34rem] sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nk-gold">
                    {page.composition}
                  </p>
                  <h2
                    id={`${recipe.slug}-title`}
                    className="mt-2 font-serif text-3xl leading-tight text-white sm:text-4xl"
                  >
                    {recipe.title}
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-nk-cream/75">{recipe.text}</p>
                  <div className="relative mt-2 flex-1">
                    <DishVisual
                      layers={DISH_LAYERS[recipe.slug] ?? []}
                      labels={recipe.layers}
                      label={recipe.title}
                    />
                  </div>
                </section>

                {/* how it is prepared */}
                <section className="rounded-[1.5rem] bg-nk-cream p-5 text-nk-ink sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-serif text-2xl text-nk-ink">{page.howTo}</h3>
                    <span className="inline-flex items-center gap-2 rounded-full bg-nk-sage/70 px-3 py-1 text-sm text-nk-forest">
                      <ClockIcon width={16} height={16} />
                      {page.time}: {recipe.time}
                    </span>
                  </div>
                  <ol className="mt-5 space-y-3">
                    {recipe.steps.map((step, i) => (
                      <li key={step} className="flex gap-3 text-[15px] leading-relaxed">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nk-forest text-xs font-semibold text-white">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <h4 className="mt-6 text-sm font-semibold uppercase tracking-wider text-nk-forest">
                    {page.ingredients}
                  </h4>
                  <ul className="mt-2 grid gap-x-4 gap-y-1.5 text-[15px] sm:grid-cols-2">
                    {recipe.ingredients.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nk-gold" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-nk-beige pt-4">
                    <span className="text-sm text-nk-muted">{page.products}:</span>
                    {recipe.products.map(productLink).map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        className="rounded-full bg-nk-forest px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-nk-deep"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </section>
              </div>

              {/* slogan over wavy lines */}
              <footer className="relative px-6 pb-8 pt-3 text-center sm:px-10">
                <Waves />
                <p className="relative mx-auto max-w-3xl font-serif text-lg italic leading-relaxed text-nk-cream/90 sm:text-xl">
                  {recipe.slogan}
                </p>
              </footer>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
