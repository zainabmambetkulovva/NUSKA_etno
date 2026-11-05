'use client';

import type { PointerEvent } from 'react';

import type { ProductCard as ProductCardData } from '@nuska/types';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';

import { AddToCartButton } from './add-to-cart-button';
import { FavoriteButton } from './favorite-button';
import { ProductImage } from './product-image';

import { Badge } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { formatMoney } from '@/lib/format';

/**
 * Product card (TZ §6.3) with a light 3D tilt, depth and shadow change on hover (TZ §7.4).
 * The tilt is disabled for touch input and reduced motion.
 */
export function ProductCard({
  product,
  priority,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(y, [0, 1], [5, -5]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 });

  const onMove = (event: PointerEvent<HTMLElement>) => {
    if (reduce || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width);
    y.set((event.clientY - rect.top) / rect.height);
  };
  const reset = () => {
    x.set(0.5);
    y.set(0.5);
  };
  const href = `/${locale}/product/${product.slug}`;

  return (
    <motion.article
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      className="group card relative flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lift"
    >
      <Link href={href} className="block" tabIndex={-1} aria-hidden>
        <ProductImage
          url={product.image?.url}
          alt={product.image?.alt}
          name={product.name}
          priority={priority}
          placeholderLabel={t.product.photoSoon}
          className="aspect-[4/3] [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105"
        />
      </Link>
      <FavoriteButton productId={product.id} className="absolute right-3 top-3 z-10" />
      {!product.inStock && (
        <Badge tone="gray" className="absolute left-3 top-3">
          {t.product.outOfStock}
        </Badge>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.categories[0] && (
          <span className="text-xs uppercase tracking-wider text-olive">
            {product.categories[0].name}
          </span>
        )}
        <h3 className="font-serif text-lg font-semibold leading-snug">
          <Link
            href={href}
            className="after:absolute after:inset-0 after:content-[''] hover:text-brand"
          >
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && (
          <p className="line-clamp-2 text-sm text-ink-muted">{product.shortDescription}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="text-lg font-semibold text-brand-dark">
            {formatMoney(product.price, locale, t.common.som)}
          </span>
          <div className="relative z-10">
            <AddToCartButton product={product} size="sm" />
          </div>
        </div>
      </div>
    </motion.article>
  );
}
