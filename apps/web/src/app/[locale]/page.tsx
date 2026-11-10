import type {
  CategoryNode,
  Page,
  ProductCard as ProductCardData,
  SiteContent,
  Testimonial,
} from '@nuska/types';
import Link from 'next/link';

import { Leaf, MountainSilhouettes, OrnamentBand, Wave } from '@/components/brand/kyrgyz-decor';
import { LogoMark } from '@/components/brand/logo';
import { Hero } from '@/components/home/hero';
import { PricesSection } from '@/components/home/prices-section';
import { TestimonialsCarousel } from '@/components/home/testimonials';
import { InstagramIcon } from '@/components/layout/social-icons';
import { ArrowRightIcon, HeartIcon, JugIcon, QualityIcon, SproutIcon } from '@/components/ui/icons';
import { Reveal } from '@/components/ui/reveal';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { resolveLocale } from '@/lib/locale-params';

const WHY_ICONS = [SproutIcon, QualityIcon, JugIcon, HeartIcon];

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
      <section className="relative bg-sand" aria-labelledby="why-title">
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
