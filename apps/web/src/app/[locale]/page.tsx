import type {
  Banner,
  CategoryNode,
  FaqItem,
  Page,
  PickupLocation,
  ProductCard as ProductCardData,
  PublicReview,
  SiteContent,
} from '@nuska/types';
import Link from 'next/link';

import { KochkorMuyuz, OrnamentDivider } from '@/components/brand/ornament';
import { FaqList } from '@/components/content/faq-list';
import { StoresList } from '@/components/content/stores-list';
import { BenefitIcon } from '@/components/home/benefit-icon';
import { Hero } from '@/components/home/hero';
import { NewsletterForm } from '@/components/home/newsletter-form';
import { ReviewsSlider } from '@/components/home/reviews-slider';
import { StoryScene } from '@/components/home/story-scene';
import { ProductCard } from '@/components/product/product-card';
import { ButtonLink } from '@/components/ui/button';
import { ChevronRightIcon, ClockIcon, PinIcon } from '@/components/ui/icons';
import { SectionHeading } from '@/components/ui/misc';
import { Parallax } from '@/components/ui/parallax';
import { Reveal } from '@/components/ui/reveal';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { resolveLocale } from '@/lib/locale-params';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);

  const empty: Page<ProductCardData> = { data: [], meta: { total: 0, limit: 0, offset: 0 } };
  const [categories, featured, all, pickup, reviews, banners, about, faq] = await Promise.all([
    serverApiSafe<CategoryNode[]>('/categories', locale, []),
    serverApiSafe<Page<ProductCardData>>('/products?featured=true&limit=8', locale, empty),
    serverApiSafe<Page<ProductCardData>>('/products?limit=50', locale, empty),
    serverApiSafe<PickupLocation[]>('/pickup-locations', locale, []),
    serverApiSafe<PublicReview[]>('/reviews/latest?limit=9', locale, []),
    serverApiSafe<Banner[]>('/content/banners', locale, []),
    serverApiSafe<SiteContent | null>('/content/home.about', locale, null),
    serverApiSafe<FaqItem[]>('/faq', locale, []),
  ]);
  const products = featured.data.length > 0 ? featured.data : all.data;

  return (
    <>
      {/* 01 — Hero with the interactive 3D dastorkon */}
      <Hero locale={locale} t={t} sceneProducts={all.data} />

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

      {/* 02 — Categories */}
      {categories.length > 0 && (
        <section className="section container">
          <Reveal>
            <SectionHeading title={t.home.categoriesTitle} subtitle={t.home.categoriesSubtitle} />
          </Reveal>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {categories.map((category, i) => (
              <Reveal key={category.id} delay={i * 0.05}>
                <Link
                  href={`/${locale}/catalog/${category.slug}`}
                  className="group card relative flex h-full min-h-[190px] flex-col overflow-hidden transition duration-300 hover:-translate-y-1.5 hover:shadow-lift"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-brand">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <>
                        <div
                          className="bg-ornament absolute inset-0 opacity-25 transition duration-700 group-hover:scale-110 group-hover:opacity-40"
                          aria-hidden
                        />
                        <KochkorMuyuz className="relative h-10 w-20 text-cream transition duration-500 group-hover:-translate-y-1 group-hover:scale-110" />
                      </>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <h3 className="font-serif text-lg font-semibold leading-snug group-hover:text-brand">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="line-clamp-2 text-sm text-ink-soft">{category.description}</p>
                    )}
                    <span className="mt-auto flex items-center justify-between pt-2 text-sm text-ink-soft">
                      {category.productCount}
                      <ChevronRightIcon
                        width={16}
                        height={16}
                        className="text-brand opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100"
                      />
                    </span>
                  </div>
                  <KochkorMuyuz className="absolute right-2 top-2 h-4 w-8 text-gold opacity-0 transition group-hover:opacity-100" />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* 03 — Our products */}
      {products.length > 0 && (
        <section className="section bg-cream-50">
          <div className="container">
            <Reveal>
              <SectionHeading
                title={t.home.popularTitle}
                subtitle={t.home.popularSubtitle}
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

      {/* 05 — Brand story with the yurt scene */}
      <section id="story" className="section relative scroll-mt-20 overflow-hidden">
        <Parallax speed={0.25}>
          <KochkorMuyuz className="absolute -left-20 top-0 h-48 w-96 text-brand/[0.05]" />
        </Parallax>
        <div className="container relative grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <StoryScene label={t.home.storySceneLabel} />
          </Reveal>
          <Reveal className="space-y-5" delay={0.1}>
            <OrnamentDivider className="max-w-xs" />
            <h2 className="section-title">{t.home.storyTitle}</h2>
            <p className="whitespace-pre-line text-lg leading-relaxed text-ink-muted">
              {about?.body || t.home.aboutText}
            </p>
            <p className="text-ink-muted">{t.home.dastorkonText}</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`/${locale}/about`}>{t.home.storyCta}</ButtonLink>
              <ButtonLink href={`/${locale}/traditions`} variant="outline">
                {t.nav.traditions}
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 06 — Benefits */}
      <section className="section relative overflow-hidden bg-brand text-cream-light">
        <div className="bg-ornament absolute inset-0 opacity-[0.07]" aria-hidden />
        <div className="container relative">
          <Reveal>
            <h2 className="section-title mb-10 text-cream-light">{t.home.advantagesTitle}</h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.advantages.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <div className="group h-full rounded-2xl border border-cream/15 bg-white/5 p-6 transition duration-300 hover:-translate-y-1 hover:bg-white/10">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream text-brand transition group-hover:bg-gold-light">
                    <BenefitIcon index={i} />
                  </div>
                  <h3 className="mb-2 font-serif text-xl text-cream-light">{item.title}</h3>
                  <p className="text-sm text-cream/75">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 08 — Gift set builder preview */}
      <section className="section container">
        <Reveal>
          <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-cream-dark/60 bg-cream-light p-6 md:grid-cols-[1.1fr_1fr] md:p-10">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-olive">
                <KochkorMuyuz className="h-3 w-6 text-gold" /> 3D
              </span>
              <h2 className="section-title">{t.gift.title}</h2>
              <p className="text-ink-muted">{t.gift.previewText}</p>
              <ButtonLink href={`/${locale}/gift-builder`} size="lg">
                {t.gift.cta}
              </ButtonLink>
            </div>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-md" aria-hidden>
              <div className="absolute inset-x-6 bottom-6 top-1/3 rounded-2xl border-[12px] border-[#8A5A33] bg-cream shadow-lift" />
              <div className="absolute inset-x-6 top-[30%] h-4 bg-brand" />
              <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-3">
                {['#FBFBF7', '#F1C84B', '#F39A3D', '#E8C27E'].map((c, i) => (
                  <span
                    key={c}
                    className="block h-14 w-10 rounded-lg shadow-card motion-safe:animate-float"
                    style={{ background: c, animationDelay: `${i * 0.4}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 10 — Pickup */}
      <section className="section bg-cream-50">
        <div className="container">
          <Reveal>
            <SectionHeading title={t.home.pickupTitle} subtitle={t.home.pickupText} />
          </Reveal>
          <ol className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.pickupSteps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08}>
                <li className="relative h-full rounded-2xl border border-cream-dark/60 bg-milk p-5">
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand font-serif text-cream-light">
                    {i + 1}
                  </span>
                  <h3 className="mb-1 font-serif text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-ink-muted">{step.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
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
          <StoresList locale={locale} className="mt-12" />
        </div>
      </section>

      {/* 09 — Reviews (only real, moderated ones) */}
      <section id="reviews" className="section container scroll-mt-20">
        <Reveal>
          <SectionHeading title={t.home.reviewsTitle} />
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-cream-dark bg-milk px-6 py-12 text-center">
              <KochkorMuyuz className="h-10 w-20 text-brand/40" animate />
              <p className="font-serif text-xl">{t.home.reviewsEmpty}</p>
              <p className="max-w-md text-sm text-ink-soft">{t.home.reviewsEmptyText}</p>
            </div>
          ) : (
            <ReviewsSlider reviews={reviews} />
          )}
        </Reveal>
      </section>

      {/* 11 — FAQ */}
      {faq.length > 0 && (
        <section className="section bg-cream-50">
          <div className="container max-w-4xl">
            <Reveal>
              <SectionHeading
                title={t.home.faqTitle}
                action={
                  <Link
                    href={`/${locale}/faq`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                  >
                    {t.home.faqAll}
                    <ChevronRightIcon width={16} height={16} />
                  </Link>
                }
              />
              <FaqList items={faq.slice(0, 5)} />
            </Reveal>
          </div>
        </section>
      )}

      {/* 12 — Newsletter */}
      <section className="section container">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-10 text-cream-light shadow-lift md:px-12 md:py-14">
            <div className="bg-ornament absolute inset-0 opacity-10" aria-hidden />
            <KochkorMuyuz className="absolute -right-10 -top-6 h-32 w-64 text-gold/20 motion-safe:animate-float" />
            <div className="relative grid items-center gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <h2 className="font-serif text-3xl text-cream-light md:text-4xl">
                  {t.newsletter.title}
                </h2>
                <p className="text-cream/80">{t.newsletter.text}</p>
              </div>
              <NewsletterForm />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
