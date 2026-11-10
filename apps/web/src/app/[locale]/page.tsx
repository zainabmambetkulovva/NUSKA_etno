import type {
  CategoryNode,
  Page,
  ProductCard as ProductCardData,
  SiteContent,
  Testimonial,
} from '@nuska/types';
import Link from 'next/link';

import { MountainSilhouettes, OrnamentBand } from '@/components/brand/kyrgyz-decor';
import { LogoMark } from '@/components/brand/logo';
import { Hero } from '@/components/home/hero';
import { PricesSection } from '@/components/home/prices-section';
import { TestimonialsCarousel } from '@/components/home/testimonials';
import { WhyUs } from '@/components/home/why-us';
import { InstagramIcon } from '@/components/layout/social-icons';
import { ArrowRightIcon } from '@/components/ui/icons';
import { Reveal } from '@/components/ui/reveal';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { resolveLocale } from '@/lib/locale-params';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);

  const empty: Page<ProductCardData> = { data: [], meta: { total: 0, limit: 0, offset: 0 } };
  const [products, categories, testimonials, contacts] = await Promise.all([
    serverApiSafe<Page<ProductCardData>>('/products?limit=100', locale, empty),
    serverApiSafe<CategoryNode[]>('/categories', locale, []),
    serverApiSafe<Testimonial[]>('/testimonials', locale, []),
    serverApiSafe<SiteContent | null>('/content/contacts', locale, null),
  ]);
  const instagram = contacts?.data?.instagram;
  const instagramUrl =
    typeof instagram === 'string' && instagram.trim()
      ? `https://www.instagram.com/${instagram.trim().replace(/^@/, '')}`
      : null;

  return (
    <>
      <Hero locale={locale} t={t} />

      {/* 02 — Why choose us */}
      <WhyUs t={t} />

      {/* 03 — Our prices (straight from the catalog) */}
      <PricesSection products={products.data} categories={categories} />

      {/* 04 — Customer testimonials (admin-managed) */}
      <section
        id="reviews"
        className="relative scroll-mt-20 overflow-hidden bg-[#243D2B] pb-16 pt-20 text-[#FAF8EF]"
        aria-labelledby="reviews-title"
        data-flush-footer
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(214,173,98,0.22),transparent_50%),radial-gradient(ellipse_at_50%_100%,#355B3E,transparent_60%)]"
          aria-hidden
        />
        <MountainSilhouettes className="absolute inset-x-0 bottom-0 h-[240px] w-full opacity-70" />
        <div className="container relative">
          <Reveal className="relative text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D6AD62]">
              Real stories • Real impressions
            </p>
            <h2 id="reviews-title" className="mt-4 font-serif text-4xl text-[#FAF8EF] sm:text-5xl">
              {t.home.reviewsTitle}
            </h2>
            <p className="mt-3 font-serif text-lg italic text-[#F4E9B9]/85">{t.home.reviewsText}</p>
            <div className="mx-auto mt-6 flex max-w-sm items-center gap-4" aria-hidden>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D6AD62]" />
              <LogoMark className="h-8 w-8" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D6AD62]" />
            </div>
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#D6AD62]/60 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#F4E9B9] backdrop-blur transition hover:bg-[#D6AD62] hover:text-[#243D2B] lg:absolute lg:-top-12 lg:right-0 lg:mt-0 [&_svg]:h-4 [&_svg]:w-4"
              >
                <InstagramIcon />
                {t.home.reviewsInstagram}
              </a>
            )}
          </Reveal>

          <div className="mt-10">
            {testimonials.length === 0 ? (
              <p className="text-center text-[#F4E9B9]/80">{t.home.reviewsEmpty}</p>
            ) : (
              <TestimonialsCarousel items={testimonials} />
            )}
            {testimonials.some((item) => item.isDemo) && (
              <p className="mt-4 text-center text-xs text-[#F4E9B9]/60">
                {t.home.reviewsSampleNote}
              </p>
            )}
          </div>

          <Reveal className="relative mt-12 text-center">
            <OrnamentBand className="mx-auto max-w-md opacity-80" />
            <p className="mt-6 font-serif text-2xl text-[#F4E9B9]">{t.home.reviewsMatter}</p>
            <Link href={`/${locale}/reviews`} className="btn-gold mt-6">
              {t.home.reviewsAll}
              <ArrowRightIcon width={16} height={16} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
