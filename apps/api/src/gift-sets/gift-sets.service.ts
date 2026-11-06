import { Injectable } from '@nestjs/common';

import { MAX_ITEM_QUANTITY } from '../cart/dto/cart.dto';
import { AppError } from '../common/errors';
import { Locale } from '../common/utils/locale';
import { PrismaService } from '../prisma/prisma.service';
import { productCardInclude, toProductCard } from '../products/product.mapper';
import { PUBLIC_PRODUCT_WHERE } from '../products/products.service';

import { GiftSetItemDto, SaveGiftSetDto } from './dto/gift-sets.dto';

/** A user may keep this many saved sets. */
export const MAX_SAVED_SETS = 20;

export type GiftSetLineIssue = 'INSUFFICIENT_STOCK' | null;

/**
 * Gift set builder (TZ section 08). Sets are always priced from the current
 * catalog on the server; products that are no longer sold are reported as
 * `unavailable` instead of being priced.
 */
@Injectable()
export class GiftSetsService {
  constructor(private readonly prisma: PrismaService) {}

  async quote(items: GiftSetItemDto[], locale: Locale) {
    const wanted = new Map<string, number>();
    for (const item of items)
      wanted.set(
        item.productId,
        Math.min((wanted.get(item.productId) ?? 0) + item.quantity, MAX_ITEM_QUANTITY)
      );

    const products = await this.prisma.product.findMany({
      where: { id: { in: [...wanted.keys()] }, ...PUBLIC_PRODUCT_WHERE },
      include: productCardInclude,
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const lines = [];
    const unavailable: string[] = [];
    for (const [productId, quantity] of wanted) {
      const product = byId.get(productId);
      if (!product) {
        unavailable.push(productId);
        continue;
      }
      const issue: GiftSetLineIssue =
        product.trackInventory && product.stockQuantity < quantity ? 'INSUFFICIENT_STOCK' : null;
      lines.push({
        product: toProductCard(product, locale),
        quantity,
        lineTotal: { amount: product.priceAmount * quantity, currency: product.currency },
        issue,
      });
    }
    return {
      items: lines,
      unavailable,
      itemsCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      total: { amount: lines.reduce((sum, l) => sum + l.lineTotal.amount, 0), currency: 'KGS' },
      canOrder: lines.length > 0 && unavailable.length === 0 && lines.every((l) => !l.issue),
    };
  }

  async list(userId: string, locale: Locale) {
    const sets = await this.prisma.giftSet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return Promise.all(sets.map((set) => this.withQuote(set, locale)));
  }

  async create(userId: string, dto: SaveGiftSetDto, locale: Locale) {
    const quote = await this.quote(dto.items, locale);
    if (quote.unavailable.length > 0) {
      throw AppError.notFound('PRODUCT_NOT_FOUND', 'Some products are not available');
    }
    const set = await this.prisma.$transaction(async (tx) => {
      const count = await tx.giftSet.count({ where: { userId } });
      if (count >= MAX_SAVED_SETS) {
        throw AppError.conflict('GIFT_SET_LIMIT', `At most ${MAX_SAVED_SETS} saved sets`, {
          max: MAX_SAVED_SETS,
        });
      }
      return tx.giftSet.create({
        data: {
          userId,
          name: dto.name,
          items: {
            create: quote.items.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
          },
        },
        include: { items: true },
      });
    });
    return this.withQuote(set, locale);
  }

  async remove(userId: string, id: string) {
    const deleted = await this.prisma.giftSet.deleteMany({ where: { id, userId } });
    if (deleted.count === 0) throw AppError.notFound('GIFT_SET_NOT_FOUND', 'Gift set not found');
  }

  private async withQuote(
    set: {
      id: string;
      name: string;
      createdAt: Date;
      items: { productId: string; quantity: number }[];
    },
    locale: Locale
  ) {
    return {
      id: set.id,
      name: set.name,
      createdAt: set.createdAt,
      ...(await this.quote(set.items, locale)),
    };
  }
}
