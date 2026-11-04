import { Injectable } from '@nestjs/common';

import { AppError } from '../common/errors';
import { Locale } from '../common/utils/locale';
import { PrismaService } from '../prisma/prisma.service';
import { productCardInclude, toProductCard } from '../products/product.mapper';
import { PUBLIC_PRODUCT_WHERE } from '../products/products.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Favorites whose product was archived or deleted are hidden, not removed. */
  async list(userId: string, locale: Locale) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId, product: PUBLIC_PRODUCT_WHERE },
      orderBy: { createdAt: 'desc' },
      include: { product: { include: productCardInclude } },
    });
    return favorites.map((f) => ({
      addedAt: f.createdAt,
      product: toProductCard(f.product, locale),
    }));
  }

  async ids(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { productId: true },
    });
    return favorites.map((f) => f.productId);
  }

  /** Idempotent: adding twice keeps one record (DATABASE.md §9). */
  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, ...PUBLIC_PRODUCT_WHERE },
    });
    if (!product) throw AppError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
    await this.prisma.favorite.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });
  }

  async remove(userId: string, productId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, productId } });
  }
}
