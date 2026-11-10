'use client';

import { useMemo, useState } from 'react';

import type { CategoryNode, ProductCard } from '@nuska/types';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { LogoMark } from '@/components/brand/logo';
import { AddToCartButton } from '@/components/product/add-to-cart-button';
import { ArrowRightIcon, LeafIcon, PinIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { formatMoney } from '@/lib/format';

/** One product line with its sizes: "Нават 0.5 / 0.6 / 0.7" → "Нават" with three prices. */
interface Group {
  key: string;
  name: string;
  categoryId: string | null;
  variants: { label: string; product: ProductCard }[];
}

const SIZE = /\s+(\d+(?:[.,]\d+)?\s*(?:кг|л|г|мл)?)$/i;

function groupProducts(products: ProductCard[]): Group[] {
  const groups = new Map<string, Group>();
  for (const product of products) {
    const [head, tail] = product.name.split(/\s+[—–-]\s+/);
    const size = head.match(SIZE);
    const name = (size ? head.replace(SIZE, '') : head).trim();
    const label = tail ?? size?.[1] ?? '';
    const key = name.toLocaleLowerCase();
    const group = groups.get(key) ?? {
      key,
      name,
      categoryId: product.categories[0]?.id ?? null,
      variants: [],
    };
    group.variants.push({ label, product });
    groups.set(key, group);
  }
  return [...groups.values()];
}

const TINTS = [
  'from-[#FBE7C0] to-[#E9C27A]',
  'from-[#E8F0DA] to-[#BFD49F]',
  'from-[#FCE3D3] to-[#EDB892]',
  'from-[#FFF2C6] to-[#F2D272]',
  'from-[#E6EEF4] to-[#BDD3E4]',
];

/** Product photo, or until it is uploaded a warm tile with the gold mark. */
function Visual({ product, name, tint }: { product: ProductCard; name: string; tint: string }) {
  return product.image ? (
    <Image
      src={product.image.url}
      alt={product.image.alt || name}
      fill
      sizes="(min-width: 1024px) 260px, 45vw"
      className="object-contain p-3 drop-shadow-[0_18px_18px_rgba(60,35,10,0.35)] transition duration-700 group-hover:scale-110"
      unoptimized={!process.env.NEXT_PUBLIC_IMAGES_HOST}
    />
  ) : (
    <span
      className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${tint}`}
    >
      <LogoMark className="h-16 w-16 opacity-80 transition duration-700 group-hover:rotate-45" />
      <span className="font-serif text-lg text-forest/80">{name}</span>
    </span>
  );
}

/**
 * "Our prices": every product line with its sizes and prices straight from
 * the catalog (the admin changes a price → it changes here). The richest
 * line is shown large with floating price tags; the others as animated tiles
 * filtered by category tabs. Each tile can be added to the cart.
 */
export function PricesSection({
  products,
  categories,
}: {
  products: ProductCard[];
  categories: CategoryNode[];
}) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<string>('all');
  const groups = useMemo(() => groupProducts(products), [products]);
  const featured = useMemo(
    () => [...groups].sort((a, b) => b.variants.length - a.variants.length)[0],
    [groups]
  );
  const usedCategories = categories.filter((c) => groups.some((g) => g.categoryId === c.id));
  const shown = groups.filter((g) => g !== featured && (tab === 'all' || g.categoryId === tab));
  if (!featured) return null;
  const price = (p: ProductCard) => formatMoney(p.price, locale, t.common.som);

  return (
    <section
      id="prices"
      className="relative scroll-mt-20 overflow-hidden bg-sand py-16 sm:py-20"
      aria-labelledby="prices-title"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(214,173,98,0.25),transparent_45%),radial-gradient(ellipse_at_10%_90%,rgba(53,91,62,0.12),transparent_50%)]"
        aria-hidden
      />
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduce ? 0 : 0.7 }}
          className="text-center"
        >
          <LogoMark className="mx-auto h-9 w-9" />
          <h2 id="prices-title" className="mt-3 font-serif text-4xl text-forest sm:text-5xl">
            {t.home.pricesTitle}
          </h2>
          <p className="mt-3 font-serif text-lg italic text-ink-muted">{t.home.pricesText}</p>
        </motion.div>

        {/* featured line with floating price tags */}
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: reduce ? 0 : 0.7 }}
          >
            <h3 className="font-serif text-4xl text-forest">{featured.name}</h3>
            {featured.variants[0].product.shortDescription && (
              <p className="mt-1 text-ink-muted">{featured.variants[0].product.shortDescription}</p>
            )}
            <ul className="mt-6 space-y-3">
              {featured.variants.map(({ label, product }) => (
                <li key={product.id} className="flex items-center gap-3 text-lg">
                  <LeafIcon width={18} height={18} className="shrink-0 text-honey-dark" />
                  <span>
                    {featured.name} {label}
                  </span>
                  <span className="text-ink-soft">—</span>
                  <span className="font-semibold text-forest">{price(product)}</span>
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/product/${featured.variants[0].product.slug}`}
              className="btn-outline-dark mt-8"
            >
              {t.home.pricesView}
              <ArrowRightIcon width={16} height={16} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduce ? 0 : 0.8 }}
            className="group relative mx-auto aspect-[4/3] w-full max-w-xl"
          >
            <div className="absolute inset-[12%] overflow-hidden rounded-[2.5rem] shadow-lift">
              <Visual product={featured.variants[0].product} name={featured.name} tint={TINTS[0]} />
            </div>
            {featured.variants.map(({ label, product }, i) => {
              const spots = [
                'left-0 top-[18%]',
                'left-1/2 top-0 -translate-x-1/2',
                'right-0 top-[18%]',
                'bottom-0 left-[12%]',
                'bottom-0 right-[12%]',
              ];
              return (
                <motion.span
                  key={product.id}
                  className={`absolute ${spots[i % spots.length]} rounded-2xl bg-sand-light/95 px-4 py-2 text-center shadow-[0_14px_30px_-14px_rgba(60,35,10,0.6)] ring-1 ring-honey/40`}
                  animate={reduce ? undefined : { y: [0, -10, 0] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: 'easeInOut',
                  }}
                >
                  <span className="block text-xs text-ink-muted">
                    {featured.name} {label}
                  </span>
                  <span className="block font-semibold text-forest">{price(product)}</span>
                </motion.span>
              );
            })}
          </motion.div>
        </div>

        {/* category tabs */}
        {usedCategories.length > 1 && (
          <div
            className="mx-auto mt-16 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-sand-light p-1.5 shadow-[0_10px_30px_-18px_rgba(60,35,10,0.6)] ring-1 ring-honey/30"
            role="tablist"
            aria-label={t.home.pricesTitle}
          >
            {[{ id: 'all', name: t.home.pricesAll }, ...usedCategories].map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={tab === c.id}
                onClick={() => setTab(c.id)}
                className={`relative whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition ${tab === c.id ? 'text-cream-light' : 'text-ink hover:text-forest'}`}
              >
                {tab === c.id && (
                  <motion.span
                    layoutId="prices-tab"
                    className="absolute inset-0 rounded-full bg-forest"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{c.name}</span>
              </button>
            ))}
          </div>
        )}

        <motion.ul
          layout
          className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {shown.map((group, i) => {
              const first = group.variants[0].product;
              return (
                <motion.li
                  key={group.key}
                  layout
                  initial={{ opacity: 0, y: 30, rotateX: 12 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : (i % 8) * 0.06 }}
                  whileHover={reduce ? undefined : { y: -8, rotateX: 4, rotateY: -4 }}
                  style={{ transformPerspective: 900 }}
                  className="group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-sand-light shadow-[0_18px_36px_-22px_rgba(60,35,10,0.6)] ring-1 ring-honey/25"
                >
                  <Link
                    href={`/${locale}/product/${first.slug}`}
                    className="relative block aspect-square overflow-hidden"
                    aria-label={group.name}
                  >
                    <Visual
                      product={first}
                      name={group.name}
                      tint={TINTS[(i + 1) % TINTS.length]}
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="font-serif text-lg leading-snug text-forest">{group.name}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {group.variants.map(({ label, product }) => (
                        <span
                          key={product.id}
                          className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-cream-light"
                        >
                          {label && `${label} · `}
                          {price(product)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto pt-2">
                      <AddToCartButton product={first} size="sm" className="w-full" />
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>

        {/* promises + buy */}
        <div className="mt-14 flex flex-col items-center justify-between gap-6 rounded-[2rem] bg-forest px-6 py-6 text-cream-light sm:flex-row sm:px-10">
          <ul className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm">
            <li className="flex items-center gap-3">
              <LeafIcon className="h-7 w-7 shrink-0 text-honey" />
              {t.home.pricesNatural}
            </li>
            <li className="flex items-center gap-3">
              <LogoMark className="h-7 w-7 shrink-0" />
              {t.home.pricesQuality}
            </li>
            <li className="flex items-center gap-3">
              <PinIcon className="h-7 w-7 shrink-0 text-honey" />
              {t.home.pricesPickup}
            </li>
          </ul>
          <Link href={`/${locale}/catalog`} className="btn-gold shrink-0">
            {t.home.pricesBuy}
            <ArrowRightIcon width={16} height={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
