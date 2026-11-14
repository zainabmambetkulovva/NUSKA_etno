import { Prisma } from '@prisma/client';

import { Locale, pickTranslation } from '../common/utils/locale';

/** Relations needed to render a product card in any locale. */
export const productCardInclude = {
  translations: true,
  images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1 },
  units: { orderBy: { createdAt: 'asc' }, take: 1 },
  categories: {
    where: { category: { deletedAt: null, isActive: true } },
    include: { category: { include: { translations: true } } },
  },
} satisfies Prisma.ProductInclude;

export type ProductCardSource = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export function isAvailable(product: { trackInventory: boolean; stockQuantity: number }) {
  return !product.trackInventory || product.stockQuantity > 0;
}

/** "0.5 л" from a unit row; trailing zeros of the decimal are dropped. */
export function unitLabel(
  unit: { quantityValue: Prisma.Decimal; quantityUnit: string } | undefined
) {
  if (!unit) return null;
  return `${unit.quantityValue.toNumber()} ${unit.quantityUnit}`.trim();
}

/** Product card for catalog lists, cart and favorites (TZ §6.3). */
export function toProductCard(product: ProductCardSource, locale: Locale) {
  const translation = pickTranslation(product.translations, locale);
  const image = product.images[0];
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    type: product.type,
    name: translation?.name ?? product.sku,
    shortDescription: translation?.shortDescription ?? null,
    price: { amount: product.priceAmount, currency: product.currency },
    isFeatured: product.isFeatured,
    inStock: isAvailable(product),
    /** null when stock is not tracked for this product. */
    availableQuantity: product.trackInventory ? product.stockQuantity : null,
    image: image ? { url: image.url, alt: image.alt } : null,
    /** Weight or volume of the first unit, e.g. "0.5 л"; null when the product has none. */
    size: unitLabel(product.units[0]),
    categories: product.categories.map(({ category }) => ({
      id: category.id,
      slug: category.slug,
      name: pickTranslation(category.translations, locale)?.name ?? category.slug,
    })),
  };
}

export type ProductCard = ReturnType<typeof toProductCard>;

export const productDetailInclude = {
  translations: true,
  images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
  units: { orderBy: { createdAt: 'asc' } },
  categories: {
    where: { category: { deletedAt: null, isActive: true } },
    include: { category: { include: { translations: true } } },
  },
} satisfies Prisma.ProductInclude;

export type ProductDetailSource = Prisma.ProductGetPayload<{
  include: typeof productDetailInclude;
}>;

/** "One per line" text → list without empty lines. */
export function splitLines(text: string | null | undefined): string[] {
  return (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Product page (TZ §6.4). */
export function toProductDetail(
  product: ProductDetailSource,
  locale: Locale,
  rating: { average: number | null; count: number }
) {
  const translation = pickTranslation(product.translations, locale);
  return {
    ...toProductCard({ ...product, images: product.images.slice(0, 1) }, locale),
    description: translation?.description ?? null,
    ingredients: translation?.ingredients ?? null,
    benefits: splitLines(translation?.benefits),
    storageInstructions: translation?.storageInstructions ?? null,
    shelfLife: translation?.shelfLife ?? null,
    /** Nutrition facts, one line each. */
    nutrition: splitLines(translation?.nutrition),
    origin: translation?.origin ?? null,
    producer: translation?.producer ?? null,
    characteristics:
      (translation?.characteristics as { name: string; value: string }[] | null) ?? [],
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      isPrimary: image.isPrimary,
      width: image.width,
      height: image.height,
    })),
    units: product.units.map((unit) => ({
      id: unit.id,
      unitName: unit.unitName,
      quantityValue: unit.quantityValue.toNumber(),
      quantityUnit: unit.quantityUnit,
    })),
    rating,
    packaging3d: product.packaging3d,
  };
}
