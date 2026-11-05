import type {
  Banner,
  CategoryNode,
  Page,
  PickupLocation,
  ProductCard as ProductCardData,
  PublicReview,
  SiteContent,
} from '@nuska/types';
import Link from 'next/link';

import { KochkorMuyuz, OrnamentDivider } from '@/components/brand/ornament';
import { Hero } from '@/components/home/hero';
import { Stars } from '@/components/home/stars';
import { ProductCard } from '@/components/product/product-card';
import { ButtonLink } from '@/components/ui/button';
import { BagIcon, ChevronRightIcon, ClockIcon, LeafIcon, PinIcon } from '@/components/ui/icons';
import { SectionHeading } from '@/components/ui/misc';
import { Reveal } from '@/components/ui/reveal';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { formatDate } from '@/lib/format';
import { resolveLocale } from '@/lib/locale-params';

const ADVANTAGE_ICONS = [LeafIcon, KochkorIcon, BagIcon, PinIcon];

function KochkorIcon() {
  return <KochkorMuyuz className="h-5 w-10" />;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);

  const empty: Page<ProductCardData> = { data: [], meta: { total: 0, limit: 0, offset: 0 } };
  const [categories, featured, popular, pickup, reviews, banners, about] = await Promise.all([
    serverApiSafe<CategoryNode[]>('/categories', locale, []),
    serverApiSafe<Page<ProductCardData>>('/products?featured=true&limit=8', locale, empty),
    serverApiSafe<Page<ProductCardData>>('/products?sort=popular&limit=8', locale, empty),
    serverApiSafe<PickupLocation[]>('/pickup-locations', locale, []),
    serverApiSafe<PublicReview[]>('/reviews/latest?limit=6', locale, []),
    serverApiSafe<Banner[]>('/content/banners', locale, []),
    serverApiSafe<SiteContent | null>('/content/home.about', locale, null),
  ]);
  const products = featured.data.length > 0 ? featured.data : popular.data;

  return (
    <>
      <Hero locale={locale} t={t} />

      {banners.length > 0 && (
        <section className="container pt-10" aria-label="banners">
          <div className="grid gap-4 md:grid-cols-2">
            {banners.slice(0, 2).map((banner) => (
              <div
                key={banner.id}
                className="relative overflow-hidden rounded-2xl bg-brand p-8 text-cream-light shadow-card"
              >
                <div className="bg-ornament absolute inset-0 opacity-40" aria-hidden />
                <div className="relative space-y-2">
                  <h2 className="font-serif text-2xl text-cream-light">{banner.title}</h2>
                  {banner.subtitle && <p className="text-cream/80">{banner.subtitle}</p>}
                  {banner.linkUrl && banner.buttonLabel && (
                    <ButtonLink
                      href={
                        banner.linkUrl.startsWith('/')
                          ? `/${locale}${banner.linkUrl}`
                          : banner.linkUrl
                      }
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                    >
                      {banner.buttonLabel}
                    </ButtonLink>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section container">
          <Reveal>
            <SectionHeading title={t.home.categoriesTitle} />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/${locale}/catalog/${category.slug}`}
                  className="group card relative flex min-h-[150px] flex-col justify-between overflow-hidden p-5 transition hover:-translate-y-1 hover:shadow-lift"
                >
                  <div
                    className="bg-ornament absolute inset-0 opacity-70 transition group-hover:opacity-100"
                    aria-hidden
                  />
                  <KochkorMuyuz className="relative h-6 w-12 text-brand/50" />
                  <div className="relative">
                    <h3 className="font-serif text-lg font-semibold leading-snug group-hover:text-brand">
                      {category.name}
                    </h3>
                    <span className="text-sm text-ink-soft">{category.productCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* Popular products */}
      {products.length > 0 && (
        <section className="section bg-cream-50">
          <div className="container">
            <Reveal>
              <SectionHeading
                title={t.home.popularTitle}
                action={
                  <Link
                    href={`/${locale}/catalog`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                  >
                    {t.common.showAll}
                    <ChevronRightIcon width={16} height={16} />
                  </Link>
                }
              />
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.slice(0, 8).map((product, i) => (
                <Reveal key={product.id} delay={(i % 4) * 0.06}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About */}
      <section className="section container">
        <Reveal className="mx-auto max-w-3xl text-center">
          <OrnamentDivider className="mb-6" />
          <h2 className="section-title mb-5">{about?.title || t.home.aboutTitle}</h2>
          <p className="whitespace-pre-line text-lg leading-relaxed text-ink-muted">
            {about?.body || t.home.aboutText}
          </p>
          <ButtonLink href={`/${locale}/about`} variant="outline" className="mt-8">
            {t.home.philosophy}
          </ButtonLink>
        </Reveal>
      </section>

      {/* Advantages */}
      <section className="section bg-brand text-cream-light">
        <div className="container">
          <Reveal>
            <h2 className="section-title mb-10 text-cream-light">{t.home.advantagesTitle}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {t.home.advantages.map((item, i) => {
                const Icon = ADVANTAGE_ICONS[i % ADVANTAGE_ICONS.length];
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-cream/15 bg-white/5 p-6"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream text-brand">
                      <Icon />
                    </div>
                    <h3 className="mb-2 font-serif text-xl text-cream-light">{item.title}</h3>
                    <p className="text-sm text-cream/75">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Kyrgyz dastorkon */}
      <section className="section container">
        <Reveal className="grid items-center gap-10 lg:grid-cols-2">
          <div className="bg-ornament relative aspect-[4/3] overflow-hidden rounded-2xl bg-cream-light shadow-card">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex aspect-square h-3/4 items-center justify-center rounded-full border-[10px] border-brand/80 bg-cream">
                <KochkorMuyuz className="h-20 w-40 text-brand" animate />
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <h2 className="section-title">{t.home.dastorkonTitle}</h2>
            <p className="text-lg leading-relaxed text-ink-muted">{t.home.dastorkonText}</p>
            <ButtonLink href={`/${locale}/catalog`}>{t.home.toCatalog}</ButtonLink>
          </div>
        </Reveal>
      </section>

      {/* Pickup */}
      <section className="section bg-cream-50">
        <div className="container">
          <Reveal>
            <SectionHeading title={t.home.pickupTitle} />
            <p className="-mt-4 mb-8 max-w-2xl text-ink-muted">{t.home.pickupText}</p>
            {pickup.length === 0 ? (
              <p className="text-ink-soft">{t.home.pickupEmpty}</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pickup.map((point) => (
                  <div key={point.id} className="card space-y-2 p-6">
                    <div className="flex items-center gap-2 text-brand">
                      <PinIcon />
                      <h3 className="font-serif text-lg font-semibold">{point.name}</h3>
                    </div>
                    <p className="text-ink-muted">{point.address}</p>
                    {point.openingHours && (
                      <p className="flex items-center gap-2 text-sm text-ink-soft">
                        <ClockIcon width={16} height={16} /> {point.openingHours}
                      </p>
                    )}
                    {point.phone && <p className="text-sm text-ink-soft">{point.phone}</p>}
                  </div>
                ))}
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* Reviews */}
      <section className="section container">
        <Reveal>
          <SectionHeading title={t.home.reviewsTitle} />
          {reviews.length === 0 ? (
            <p className="text-ink-soft">{t.home.reviewsEmpty}</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <figure key={review.id} className="card flex flex-col gap-3 p-6">
                  <Stars value={review.rating} />
                  {review.comment && (
                    <blockquote className="text-ink">“{review.comment}”</blockquote>
                  )}
                  <figcaption className="mt-auto text-sm text-ink-soft">
                    {review.author} · {formatDate(review.createdAt, locale)}
                    {review.product && (
                      <>
                        {' · '}
                        <Link
                          href={`/${locale}/product/${review.product.slug}`}
                          className="text-brand hover:underline"
                        >
                          {review.product.name}
                        </Link>
                      </>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </Reveal>
      </section>
    </>
  );
}
