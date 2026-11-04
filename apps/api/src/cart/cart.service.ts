import { Injectable } from '@nestjs/common';

import { AppError } from '../common/errors';
import { Locale } from '../common/utils/locale';
import { PrismaService } from '../prisma/prisma.service';
import { productCardInclude, toProductCard } from '../products/product.mapper';
import { PUBLIC_PRODUCT_WHERE } from '../products/products.service';

import { AddCartItemDto, MAX_ITEM_QUANTITY, MergeCartDto } from './dto/cart.dto';

export type CartIssue = 'UNAVAILABLE' | 'INSUFFICIENT_STOCK' | null;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string, locale: Locale) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: { product: { include: productCardInclude } },
        },
      },
    });

    const items = (cart?.items ?? []).map((item) => {
      const product = item.product;
      const published = product.status === 'ACTIVE' && product.deletedAt === null;
      let issue: CartIssue = null;
      if (!published) issue = 'UNAVAILABLE';
      else if (product.trackInventory && product.stockQuantity < item.quantity)
        issue = 'INSUFFICIENT_STOCK';
      return {
        productId: item.productId,
        quantity: item.quantity,
        product: toProductCard(product, locale),
        lineTotal: product.priceAmount * item.quantity,
        issue,
      };
    });

    const orderable = items.filter((item) => item.issue === null);
    return {
      items,
      itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: {
        amount: orderable.reduce((sum, item) => sum + item.lineTotal, 0),
        currency: 'KGS',
      },
      canCheckout: items.length > 0 && orderable.length === items.length,
    };
  }

  async addItem(userId: string, dto: AddCartItemDto, locale: Locale) {
    const product = await this.getOrderableProduct(dto.productId);
    const cart = await this.ensureCart(userId);
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
    });
    const quantity = (existing?.quantity ?? 0) + dto.quantity;
    this.assertQuantity(product, quantity);

    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
      update: { quantity },
      create: { cartId: cart.id, productId: dto.productId, quantity },
    });
    return this.getCart(userId, locale);
  }

  async setQuantity(userId: string, productId: string, quantity: number, locale: Locale) {
    const cart = await this.ensureCart(userId);
    const item = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (!item) throw AppError.notFound('CART_ITEM_NOT_FOUND', 'Product is not in the cart');

    const product = await this.getOrderableProduct(productId);
    this.assertQuantity(product, quantity);
    await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    return this.getCart(userId, locale);
  }

  async removeItem(userId: string, productId: string, locale: Locale) {
    await this.prisma.cartItem.deleteMany({ where: { cart: { userId }, productId } });
    return this.getCart(userId, locale);
  }

  async clear(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cart: { userId } } });
  }

  /**
   * Adds guest-cart items to the account cart. Quantities are summed and
   * capped by stock and the per-item limit; unavailable products are reported.
   */
  async merge(userId: string, dto: MergeCartDto, locale: Locale) {
    const cart = await this.ensureCart(userId);
    const skipped: { productId: string; reason: 'UNAVAILABLE' | 'INSUFFICIENT_STOCK' }[] = [];

    const incoming = new Map<string, number>();
    for (const item of dto.items)
      incoming.set(item.productId, (incoming.get(item.productId) ?? 0) + item.quantity);

    const products = await this.prisma.product.findMany({
      where: { id: { in: [...incoming.keys()] }, ...PUBLIC_PRODUCT_WHERE },
      select: { id: true, trackInventory: true, stockQuantity: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const existing = await this.prisma.cartItem.findMany({ where: { cartId: cart.id } });
    const existingById = new Map(existing.map((i) => [i.productId, i.quantity]));

    await this.prisma.$transaction(async (tx) => {
      for (const [productId, addQuantity] of incoming) {
        const product = byId.get(productId);
        if (!product) {
          skipped.push({ productId, reason: 'UNAVAILABLE' });
          continue;
        }
        let quantity = Math.min(
          (existingById.get(productId) ?? 0) + addQuantity,
          MAX_ITEM_QUANTITY
        );
        if (product.trackInventory) quantity = Math.min(quantity, product.stockQuantity);
        if (quantity < 1) {
          skipped.push({ productId, reason: 'INSUFFICIENT_STOCK' });
          continue;
        }
        await tx.cartItem.upsert({
          where: { cartId_productId: { cartId: cart.id, productId } },
          update: { quantity },
          create: { cartId: cart.id, productId, quantity },
        });
      }
    });

    return { cart: await this.getCart(userId, locale), skipped };
  }

  private ensureCart(userId: string) {
    return this.prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
  }

  private async getOrderableProduct(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, ...PUBLIC_PRODUCT_WHERE },
      select: { id: true, trackInventory: true, stockQuantity: true },
    });
    if (!product) throw AppError.notFound('PRODUCT_NOT_FOUND', 'Product is not available');
    return product;
  }

  private assertQuantity(
    product: { id: string; trackInventory: boolean; stockQuantity: number },
    quantity: number
  ) {
    if (quantity > MAX_ITEM_QUANTITY) {
      throw AppError.badRequest(
        'MAX_QUANTITY_EXCEEDED',
        `Maximum ${MAX_ITEM_QUANTITY} items per product`,
        {
          max: MAX_ITEM_QUANTITY,
        }
      );
    }
    if (product.trackInventory && quantity > product.stockQuantity) {
      throw AppError.conflict('INSUFFICIENT_STOCK', 'Not enough stock', {
        productId: product.id,
        available: product.stockQuantity,
        requested: quantity,
      });
    }
  }
}
