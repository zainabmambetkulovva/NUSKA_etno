import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AppError } from '../common/errors';
import { Locale } from '../common/utils/locale';
import { PrismaService } from '../prisma/prisma.service';
import { productCardInclude, toProductCard } from '../products/product.mapper';
import { PUBLIC_PRODUCT_WHERE } from '../products/products.service';

import { AddCartItemDto, MAX_ITEM_QUANTITY, MergeCartDto, PreviewCartDto } from './dto/cart.dto';

export type CartIssue = 'UNAVAILABLE' | 'INSUFFICIENT_STOCK' | null;

type CartProduct = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;
interface CartRow {
  productId: string;
  quantity: number;
  priceAtAdd: number | null;
  product: CartProduct;
}

/**
 * Cart lines with the current price, stock and availability. Blocking issues
 * (unavailable, not enough stock) stop the checkout; a changed price is shown
 * to the customer but does not block it.
 */
function buildCart(rows: CartRow[], locale: Locale) {
  const items = rows.map(({ productId, quantity, priceAtAdd, product }) => {
    const published = product.status === 'ACTIVE' && product.deletedAt === null;
    let issue: CartIssue = null;
    if (!published) issue = 'UNAVAILABLE';
    else if (product.trackInventory && product.stockQuantity < quantity)
      issue = 'INSUFFICIENT_STOCK';
    return {
      productId,
      quantity,
      product: toProductCard(product, locale),
      lineTotal: product.priceAmount * quantity,
      issue,
      /** null when stock is not tracked */
      available: product.trackInventory ? Math.max(0, product.stockQuantity) : null,
      /** the price when it was put in the cart, when it has changed since */
      previousPrice:
        priceAtAdd !== null && priceAtAdd !== product.priceAmount
          ? { amount: priceAtAdd, currency: product.currency }
          : null,
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
    priceChanged: items.some((item) => item.previousPrice !== null),
  };
}

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

    return buildCart(cart?.items ?? [], locale);
  }

  /**
   * A guest cart (kept in the browser) checked against the catalog: current
   * prices, stock and availability, the same shape as the account cart.
   * Products that no longer exist are listed in `missing`.
   */
  async preview(dto: PreviewCartDto, locale: Locale) {
    const ids = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: productCardInclude,
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const rows: CartRow[] = [];
    const missing: string[] = [];
    for (const item of dto.items) {
      const product = byId.get(item.productId);
      if (!product) missing.push(item.productId);
      else
        rows.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtAdd: item.priceAmount ?? null,
          product,
        });
    }
    return { ...buildCart(rows, locale), missing };
  }

  /**
   * "Fix my cart": removes products that are no longer sold, lowers quantities
   * to the stock left (removing sold-out lines) and accepts the current prices.
   */
  async fix(userId: string, locale: Locale) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    if (cart) {
      await this.prisma.$transaction(async (tx) => {
        for (const item of cart.items) {
          const product = item.product;
          const published = product.status === 'ACTIVE' && product.deletedAt === null;
          const limit = product.trackInventory ? product.stockQuantity : MAX_ITEM_QUANTITY;
          if (!published || limit < 1) {
            await tx.cartItem.delete({ where: { id: item.id } });
            continue;
          }
          await tx.cartItem.update({
            where: { id: item.id },
            data: { quantity: Math.min(item.quantity, limit), priceAtAdd: product.priceAmount },
          });
        }
      });
    }
    return this.getCart(userId, locale);
  }

  async addItem(userId: string, dto: AddCartItemDto, locale: Locale) {
    const product = await this.getOrderableProduct(dto.productId);
    // the customer sees the current price when adding: it becomes the reference
    const priceAtAdd = product.priceAmount;
    const cart = await this.ensureCart(userId);
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
    });
    const quantity = (existing?.quantity ?? 0) + dto.quantity;
    this.assertQuantity(product, quantity);

    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
      update: { quantity, priceAtAdd },
      create: { cartId: cart.id, productId: dto.productId, quantity, priceAtAdd },
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
      select: { id: true, trackInventory: true, stockQuantity: true, priceAmount: true },
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
          create: { cartId: cart.id, productId, quantity, priceAtAdd: product.priceAmount },
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
      select: { id: true, trackInventory: true, stockQuantity: true, priceAmount: true },
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
