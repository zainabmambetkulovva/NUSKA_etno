import { Injectable } from '@nestjs/common';

import { Locale, pickTranslation } from '../../common/utils/locale';
import { GiftSetItemDto } from '../../gift-sets/dto/gift-sets.dto';
import { GiftSetsService } from '../../gift-sets/gift-sets.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  productCardInclude,
  productDetailInclude,
  toProductCard,
  type ProductCard,
} from '../../products/product.mapper';
import { PUBLIC_PRODUCT_WHERE } from '../../products/products.service';

export type SetPurpose = 'dastorkon' | 'gift' | 'any';

/** Order in which products are picked for a set (catalog SKUs; unknown SKUs come after). */
const PURPOSE_ORDER: Record<SetPurpose, string[]> = {
  dastorkon: ['NAVAT-0.5', 'KATTAMA', 'BAL', 'SARY-MAI', 'ZHUPKA', 'KYMYZ', 'BESH-BARMAK'],
  gift: ['BAL', 'SARY-MAI', 'NAVAT-0.7', 'KYMYZ', 'KATTAMA', 'ZHUPKA'],
  any: [],
};

const som = (tyiyn: number) => Math.round(tyiyn) / 100;

/**
 * Read-only access to the real catalog for NUSKA AI (both the language model
 * and the built-in catalog assistant). Nothing here invents data: every name,
 * price and description comes from the database.
 */
@Injectable()
export class CatalogToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly giftSets: GiftSetsService
  ) {}

  /** All products currently sold, as cards. */
  async allProducts(locale: Locale): Promise<ProductCard[]> {
    const products = await this.prisma.product.findMany({
      where: PUBLIC_PRODUCT_WHERE,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: productCardInclude,
    });
    return products.map((p) => toProductCard(p, locale));
  }

  /** Products whose name or description in any language contains the words of the query. */
  async search(query: string, locale: Locale, limit = 8): Promise<ProductCard[]> {
    const words = query
      .toLocaleLowerCase()
      .split(/[^\p{L}\p{N}.]+/u)
      .filter((w) => w.length >= 3)
      .slice(0, 6);
    if (words.length === 0) return [];
    const products = await this.prisma.product.findMany({
      where: {
        ...PUBLIC_PRODUCT_WHERE,
        OR: words.flatMap((w) => [
          { translations: { some: { name: { contains: w.slice(0, 5), mode: 'insensitive' } } } },
          {
            translations: {
              some: { shortDescription: { contains: w, mode: 'insensitive' } },
            },
          },
        ]),
      },
      take: limit,
      orderBy: [{ sortOrder: 'asc' }],
      include: productCardInclude,
    });
    return products.map((p) => toProductCard(p, locale));
  }

  /** Product facts for answering questions (only what the company entered). */
  async details(productId: string, locale: Locale) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, ...PUBLIC_PRODUCT_WHERE },
      include: productDetailInclude,
    });
    if (!product) return null;
    const t = pickTranslation(product.translations, locale);
    return {
      card: toProductCard({ ...product, images: product.images.slice(0, 1) }, locale),
      description: t?.description ?? null,
      ingredients: t?.ingredients ?? null,
      storage: t?.storageInstructions ?? null,
      characteristics: (t?.characteristics as { name: string; value: string }[] | null) ?? [],
      units: product.units.map(
        (u) => `${u.unitName}: ${u.quantityValue.toNumber()} ${u.quantityUnit}`
      ),
    };
  }

  quote(items: GiftSetItemDto[], locale: Locale) {
    return this.giftSets.quote(items, locale);
  }

  /**
   * Picks products for a set within a budget (in som): one of each product in
   * the order that suits the purpose, skipping what does not fit or is out of
   * stock. Priced by the server.
   */
  async buildSet(budgetSom: number | null, purpose: SetPurpose, locale: Locale) {
    const products = (await this.allProducts(locale)).filter((p) => p.inStock);
    const order = PURPOSE_ORDER[purpose];
    const rank = (p: ProductCard) => {
      const i = order.indexOf(p.sku);
      return i === -1 ? order.length + 1 : i;
    };
    const sorted = [...products].sort((a, b) => rank(a) - rank(b));
    const budget = budgetSom === null ? null : Math.round(budgetSom * 100);
    const items: GiftSetItemDto[] = [];
    const picked: string[] = [];
    let total = 0;
    for (const p of sorted) {
      if (budget === null && items.length >= 5) break;
      if (budget !== null && total + p.price.amount > budget) continue;
      // Only one size of navat in a set.
      if (p.sku.startsWith('NAVAT') && picked.some((s) => s.startsWith('NAVAT'))) continue;
      picked.push(p.sku);
      items.push({ productId: p.id, quantity: 1 });
      total += p.price.amount;
    }
    return this.quote(items, locale);
  }

  async pickup() {
    return this.prisma.pickupLocation.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }],
      select: { name: true, address: true, openingHours: true, phone: true },
    });
  }

  /** Compact text for the language model. */
  static brief(p: ProductCard) {
    return {
      product_id: p.id,
      name: p.name,
      price_som: som(p.price.amount),
      in_stock: p.inStock,
      category: p.categories.map((c) => c.name).join(', ') || null,
      short_description: p.shortDescription,
    };
  }
}
