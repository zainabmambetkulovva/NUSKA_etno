import type {
  Banner,
  Page,
  ProductCard as ProductCardData,
  PublicReview,
  SiteContent,
} from '@nuska/types';
import Image from 'next/image';
import Link from 'next/link';

import {
  Leaf,
  MountainLines,
  OrnamentCorner,
  SectionTitle,
  Wave,
} from '@/components/brand/kyrgyz-decor';
import { Hero } from '@/components/home/hero';
import { NewsletterForm } from '@/components/home/newsletter-form';
import { ReviewsSlider } from '@/components/home/reviews-slider';
import {
  ArrowRightIcon,
  HeartIcon,
  JugIcon,
  MailIcon,
  QualityIcon,
  SproutIcon,
} from '@/components/ui/icons';
import { Reveal } from '@/components/ui/reveal';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { formatMoney } from '@/lib/format';
import { resolveLocale } from '@/lib/locale-params';
import { signaturePhotoKey } from '@/lib/product-photos';

/** The six signature products of the design, with their photos. */
const SIGNATURE = [
  { key: 'sary-mai', name: 'Сары май' },
  { key: 'zhupka', name: 'Жупка' },
  { key: 'besh-barmak', name: 'Бешбармак' },
  { key: 'kymyz', name: 'Кымыз' },
  { key: 'navat', name: 'Нават' },
  { key: 'kurut', name: 'Курут' },
] as const;

const WHY_ICONS = [SproutIcon, QualityIcon, JugIcon, HeartIcon];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);

  const empty: Page<ProductCardData> = { data: [], meta: { total: 0, limit: 0, offset: 0 } };
  const [all, reviews, banners, about] = await Promise.all([
    serverApiSafe<Page<ProductCardData>>('/products?limit=50', locale, empty),
    serverApiSafe<PublicReview[]>('/reviews/latest?limit=9', locale, []),
    serverApiSafe<Banner[]>('/content/banners', locale, []),
    serverApiSafe<SiteContent | null>('/content/home.about', locale, null),
  ]);

  // Each signature card opens the product itself when it is in the catalog
  // ("navat" matches "navat-0-5"), otherwise the search for it.
  const signature = SIGNATURE.map((item) => {
    const product = all.data.find((p) => signaturePhotoKey(p.slug) === item.key);
    return {
      ...item,
      product,
      href: product
        ? `/${locale}/product/${product.slug}`
        : `/${locale}/search?q=${encodeURIComponent(item.name)}`,
    };
  });

  return (
    <>
      <Hero locale={locale} t={t} />

      {/* 02 — Our products */}
      <section className="relative bg-sand pb-14 pt-6 sm:pt-8" aria-labelledby="products-title">
        <Leaf className="absolute -top-8 right-4 z-10 h-12 w-20 [--sway-from:160deg] [--sway-to:170deg] sm:right-16" />
        <div className="container">
          <Reveal>
            <SectionTitle id="products-title">{t.home.productsTitle}</SectionTitle>
          </Reveal>
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-5">
            {signature.map((item, i) => (
              <li key={item.key}>
                <Reveal delay={i * 0.06} className="h-full">
                  <Link
                    href={item.href}
                    className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] bg-sand-light shadow-[0_14px_30px_-18px_rgba(90,60,25,0.55)] ring-1 ring-honey/25 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_40px_-20px_rgba(90,60,25,0.6)]"
                  >
                    <span className="relative block aspect-[3/2] overflow-hidden">
                      <Image
                        src={`/images/home/product-${item.key}.webp`}
                        alt={item.name}
                        fill
                        sizes="(min-width: 1024px) 200px, (min-width: 640px) 33vw, 50vw"
                        className="object-cover transition duration-700 group-hover:scale-110"
                      />
                    </span>
                    <span className="flex flex-1 items-center gap-2 px-4 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-ink">{item.name}</span>
                        {item.product && (
                          <span className="block text-xs font-semibold text-honey-dark">
                            {formatMoney(item.product.price, locale, t.common.som)}
                          </span>
                        )}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sm transition group-hover:bg-forest group-hover:text-cream-light">
                        <ArrowRightIcon width={16} height={16} />
                      </span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center">
            <Link href={`/${locale}/catalog`} className="btn-outline-dark">
              {t.home.productsAll}
              <ArrowRightIcon width={16} height={16} />
            </Link>
          </div>
        </div>
      </section>

      {banners.length > 0 && (
        <section className="bg-sand pb-12" aria-label="banners">
          <div className="container grid gap-4 md:grid-cols-2">
            {banners.slice(0, 2).map((banner) => (
              <div
                key={banner.id}
                className="relative overflow-hidden rounded-[1.6rem] bg-forest p-8 text-cream-light shadow-lift"
              >
                <OrnamentCorner className="absolute -right-4 -top-4 h-24 w-24 -scale-x-100 text-honey/40" />
                <div className="relative space-y-2">
                  <h2 className="font-serif text-2xl text-cream-light">{banner.title}</h2>
                  {banner.subtitle && <p className="text-cream-light/80">{banner.subtitle}</p>}
                  {banner.linkUrl && banner.buttonLabel && (
                    <Link
                      href={
                        banner.linkUrl.startsWith('/')
                          ? `/${locale}${banner.linkUrl}`
                          : banner.linkUrl
                      }
                      className="btn-gold mt-3"
                    >
                      {banner.buttonLabel}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 03 — Why choose us */}
      <section className="relative bg-sand" aria-labelledby="why-title">
        <Wave className="text-forest" variant={2} />
        <div className="relative overflow-hidden bg-forest text-cream-light">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(125,164,83,0.25),transparent_55%),radial-gradient(ellipse_at_90%_100%,rgba(217,168,91,0.18),transparent_50%)]"
            aria-hidden
          />
          <Leaf className="absolute -left-5 top-4 h-14 w-24 [--sway-from:-30deg] [--sway-to:-20deg]" />
          <Leaf
            className="absolute -right-4 bottom-6 h-12 w-20 [--sway-from:200deg] [--sway-to:210deg]"
            style={{ animationDelay: '-2s' }}
          />
          <div className="container relative grid items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)] lg:py-12">
            <Reveal className="space-y-4">
              <h2 id="why-title" className="font-serif text-4xl leading-tight text-cream-light">
                {t.home.whyTitle}
              </h2>
              <p className="max-w-xs text-cream-light/85">{t.home.whyText}</p>
              <Link href={`/${locale}/about`} className="btn-gold">
                {t.home.learnMore}
                <ArrowRightIcon width={16} height={16} />
              </Link>
            </Reveal>
            <ul className="grid grid-cols-2 gap-y-8 md:grid-cols-4">
              {t.home.why.map((label, i) => {
                const Icon = WHY_ICONS[i] ?? SproutIcon;
                return (
                  <li
                    key={label}
                    className="group flex flex-col items-center gap-4 px-3 text-center md:border-l md:border-honey/30"
                  >
                    <Reveal delay={i * 0.08} className="flex flex-col items-center gap-4">
                      <Icon
                        width={56}
                        height={56}
                        strokeWidth={1.2}
                        className="text-honey transition duration-500 group-hover:-translate-y-1 group-hover:scale-110 group-hover:text-honey-light"
                      />
                      <span className="max-w-[10rem] text-[15px] font-medium leading-snug">
                        {label}
                      </span>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <Wave className="text-forest" flip />
      </section>

      {/* 04 — Our story */}
      <section
        id="story"
        className="relative scroll-mt-24 overflow-hidden bg-sand"
        aria-labelledby="story-title"
      >
        <OrnamentCorner className="absolute -right-3 -top-3 hidden h-32 w-32 -scale-x-100 text-honey/50 lg:block" />
        <MountainLines className="absolute -bottom-2 right-0 hidden w-[420px] text-honey-dark/45 lg:block" />
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <Reveal>
            <figure className="relative aspect-[470/234] overflow-hidden rounded-r-[2.5rem] shadow-lift lg:rounded-r-[3.5rem]">
              <Image
                src="/images/home/story.webp"
                alt={t.home.storySceneLabel}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition duration-[1.5s] hover:scale-105"
              />
            </figure>
          </Reveal>
          <Reveal className="relative px-4 pb-12 sm:px-8 lg:pb-6 lg:pr-12" delay={0.1}>
            <p className="font-medium text-ink-muted">{t.home.storyEyebrow}</p>
            <h2
              id="story-title"
              className="mt-2 max-w-md font-serif text-4xl leading-tight text-forest sm:text-[2.6rem]"
            >
              {t.home.storyTitle}
            </h2>
            <p className="mt-5 max-w-lg whitespace-pre-line leading-relaxed text-ink-muted">
              {about?.body || t.home.storyText}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-10 gap-y-5">
              <Link href={`/${locale}/about`} className="btn-outline-dark">
                {t.home.learnMore}
                <ArrowRightIcon width={16} height={16} />
              </Link>
              <p className="-rotate-6 font-script text-3xl font-semibold text-wood xl:text-4xl">
                {t.home.withLove} <span className="text-ruby">♥</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 05 — Reviews (only real, moderated ones) */}
      <section
        id="reviews"
        className="relative scroll-mt-24 bg-sand py-12"
        aria-labelledby="reviews-title"
      >
        <Leaf className="absolute -left-4 top-6 h-12 w-20 [--sway-from:-20deg] [--sway-to:-10deg]" />
        <div className="container">
          <Reveal>
            <SectionTitle id="reviews-title">{t.home.reviewsTitle}</SectionTitle>
          </Reveal>
          <div className="mt-8">
            {reviews.length === 0 ? (
              <div className="mx-auto flex max-w-2xl items-center gap-5 rounded-[1.6rem] bg-sand-light p-6 shadow-[0_14px_30px_-18px_rgba(90,60,25,0.5)] ring-1 ring-honey/25">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-forest text-honey">
                  <HeartIcon width={26} height={26} />
                </span>
                <div>
                  <p className="font-serif text-xl text-forest">{t.home.reviewsEmpty}</p>
                  <p className="text-sm text-ink-muted">{t.home.reviewsEmptyText}</p>
                </div>
              </div>
            ) : (
              <ReviewsSlider
                reviews={reviews.map((r) => ({ ...r, initials: initials(r.author) }))}
              />
            )}
          </div>
        </div>
      </section>

      {/* 06 — Gift sets and the newsletter */}
      <section className="relative bg-sand" aria-label={t.home.giftTitle} data-flush-footer>
        <Wave className="text-forest" />
        <div className="relative overflow-hidden bg-forest">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_50%,rgba(217,168,91,0.22),transparent_45%)]"
            aria-hidden
          />
          <div className="container relative grid items-center gap-8 py-8 lg:grid-cols-2 lg:py-6">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <div className="relative h-36 w-56 shrink-0 motion-safe:animate-float">
                <Image
                  src="/images/home/gift.webp"
                  alt=""
                  fill
                  sizes="224px"
                  className="object-cover [mask-image:radial-gradient(ellipse_at_center,#000_50%,transparent_72%)]"
                />
              </div>
              <div className="space-y-3">
                <h2 className="font-serif text-2xl leading-snug text-cream-light sm:text-3xl">
                  {t.home.giftTitle}
                </h2>
                <p className="text-sm text-cream-light/80">{t.home.giftText}</p>
                <Link href={`/${locale}/gift-builder`} className="btn-gold">
                  {t.home.giftCta}
                  <ArrowRightIcon width={16} height={16} />
                </Link>
              </div>
            </div>
            <div className="rounded-[1.8rem] border border-honey/40 bg-forest-dark/60 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-7">
              <div className="mb-4 flex items-start gap-4">
                <MailIcon
                  width={40}
                  height={40}
                  strokeWidth={1.3}
                  className="shrink-0 text-honey"
                />
                <div>
                  <h2 className="font-serif text-xl text-cream-light">{t.newsletter.title}</h2>
                  <p className="text-sm text-cream-light/75">{t.newsletter.text}</p>
                </div>
              </div>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
