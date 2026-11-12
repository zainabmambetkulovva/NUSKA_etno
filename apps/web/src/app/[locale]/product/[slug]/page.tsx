import type { Metadata } from 'next';

import type {
  Page,
  ProductCard as ProductCardData,
  ProductDetail,
  PublicReview,
} from '@nuska/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { OrnamentDivider } from '@/components/brand/ornament';
import { Stars } from '@/components/home/stars';
import { ProductCard } from '@/components/product/product-card';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductImage } from '@/components/product/product-image';
import { ProductPurchase } from '@/components/product/product-purchase';
import { CheckIcon } from '@/components/ui/icons';
import { Badge, SectionHeading } from '@/components/ui/misc';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiOrNull, serverApiSafe } from '@/lib/api/server';
import { formatDate, formatMoney } from '@/lib/format';
import { alternates, resolveLocale, siteUrl } from '@/lib/locale-params';

type Params = Promise<{ locale: string; slug: string }>;

async function load(params: Params) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const product = await serverApiOrNull<ProductDetail>(
    `/products/${encodeURIComponent(slug)}`,
    locale
  );
  if (!product) notFound();
  return { locale, product };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, product } = await load(params);
  const t = await getDictionary(locale);
  const description =
    product.shortDescription ??
    `${product.name} — ${formatMoney(product.price, locale, t.common.som)}`;
  return {
    title: product.name,
    description,
    alternates: alternates(locale, `/product/${product.slug}`),
    openGraph: {
      title: product.name,
      description,
      images: product.images[0]
        ? [{ url: product.images[0].url, alt: product.images[0].alt ?? product.name }]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { locale, product } = await load(params);
  const t = await getDictionary(locale);
  const empty: Page<PublicReview> = { data: [], meta: { total: 0, limit: 0, offset: 0 } };
  const [related, reviews] = await Promise.all([
    serverApiSafe<ProductCardData[]>(`/products/${product.slug}/related`, locale, []),
    serverApiSafe<Page<PublicReview>>(`/products/${product.slug}/reviews?limit=10`, locale, empty),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.description ?? product.shortDescription ?? undefined,
    image: product.images.map((i) => i.url),
    offers: {
      '@type': 'Offer',
      price: (product.price.amount / 100).toFixed(2),
      priceCurrency: product.price.currency,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/${locale}/product/${product.slug}`,
    },
    ...(product.rating.count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating.average,
            reviewCount: product.rating.count,
          },
        }
      : {}),
  };

  // an older API (deployed before this field existed) may omit it
  const benefits = product.benefits ?? [];
  const intro = product.description
    ? [{ title: t.product.description, body: product.description }]
    : [];
  const details = [
    { title: t.product.ingredients, body: product.ingredients },
    { title: t.product.storage, body: product.storageInstructions },
  ].filter((block) => block.body);
  const hasInfo = intro.length > 0 || benefits.length > 0 || details.length > 0;

  return (
    <div className="container py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <nav className="mb-6 text-sm text-ink-soft" aria-label="breadcrumbs">
        <Link href={`/${locale}`} className="hover:text-brand">
          {t.nav.home}
        </Link>{' '}
        /{' '}
        <Link href={`/${locale}/catalog`} className="hover:text-brand">
          {t.catalog.title}
        </Link>
        {product.categories[0] && (
          <>
            {' / '}
            <Link
              href={`/${locale}/catalog/${product.categories[0].slug}`}
              className="hover:text-brand"
            >
              {product.categories[0].name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <ProductGallery
            name={product.name}
            slug={product.slug}
            image={product.images[0] ?? null}
            packaging3d={product.packaging3d}
          />
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((image) => (
                <ProductImage
                  key={image.id}
                  url={image.url}
                  alt={image.alt}
                  name={product.name}
                  sizes="12vw"
                  className="aspect-square rounded-xl"
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            {product.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.categories.map((c) => (
                  <Badge key={c.id} tone="olive">
                    {c.name}
                  </Badge>
                ))}
              </div>
            )}
            <h1 className="text-4xl font-semibold leading-tight">{product.name}</h1>
            {product.rating.count > 0 && (
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Stars value={product.rating.average ?? 0} /> {product.rating.average} ·{' '}
                {product.rating.count} {t.product.reviewsCount}
              </div>
            )}
            {product.shortDescription && (
              <p className="text-lg text-ink-muted">{product.shortDescription}</p>
            )}
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-semibold text-brand-dark">
              {formatMoney(product.price, locale, t.common.som)}
            </span>
            {product.units.length > 0 && (
              <span className="text-ink-muted">
                / {product.units.map((u) => `${u.quantityValue} ${u.quantityUnit}`).join(', ')}
              </span>
            )}
          </div>

          <p className="text-sm">
            {product.inStock ? (
              <span className="text-brand">
                ● {t.product.inStock}
                {product.availableQuantity !== null &&
                  product.availableQuantity <= 10 &&
                  ` · ${t.product.left}: ${product.availableQuantity}`}
              </span>
            ) : (
              <span className="text-danger">● {t.product.outOfStock}</span>
            )}
          </p>

          <ProductPurchase product={product} />

          {product.characteristics.length > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-xl">{t.product.characteristics}</h2>
              <dl className="divide-y divide-cream-dark/60 rounded-xl border border-cream-dark/60 bg-white">
                {product.characteristics.map((c) => (
                  <div key={c.name} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                    <dt className="text-ink-muted">{c.name}</dt>
                    <dd className="text-right font-medium">{c.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {hasInfo ? (
            <>
              {intro.map((block) => (
                <section key={block.title}>
                  <h2 className="mb-2 font-serif text-xl">{block.title}</h2>
                  <p className="whitespace-pre-line leading-relaxed text-ink-muted">{block.body}</p>
                </section>
              ))}
              {benefits.length > 0 && (
                <section className="rounded-2xl border border-gold/40 bg-cream-light p-5">
                  <h2 className="mb-3 font-serif text-xl">{t.product.benefits}</h2>
                  <ul className="space-y-2.5">
                    {benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3 leading-relaxed">
                        <span
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-cream-light"
                          aria-hidden
                        >
                          <CheckIcon width={14} height={14} strokeWidth={2.4} />
                        </span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {details.map((block) => (
                <section key={block.title}>
                  <h2 className="mb-2 font-serif text-xl">{block.title}</h2>
                  <p className="whitespace-pre-line leading-relaxed text-ink-muted">{block.body}</p>
                </section>
              ))}
            </>
          ) : (
            <p className="text-sm text-ink-soft">{t.product.noInfo}</p>
          )}
        </div>
      </div>

      <OrnamentDivider className="my-16" />

      <section aria-labelledby="reviews">
        <SectionHeading title={<span id="reviews">{t.product.reviews}</span>} />
        {reviews.data.length === 0 ? (
          <p className="text-ink-soft">{t.product.noReviews}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.data.map((review) => (
              <figure key={review.id} className="card space-y-2 p-5">
                <Stars value={review.rating} />
                {review.comment && <blockquote>{review.comment}</blockquote>}
                <figcaption className="text-sm text-ink-soft">
                  {review.author} · {formatDate(review.createdAt, locale)}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeading title={t.product.related} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
