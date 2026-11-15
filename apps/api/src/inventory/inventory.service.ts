import { Injectable } from '@nestjs/common';
import { StockMovementType } from '@prisma/client';

import { AppError } from '../common/errors';
import { DbClient } from '../prisma/prisma.types';

export interface StockChange {
  productId: string;
  /** Signed delta: > 0 adds stock, < 0 removes stock. */
  delta: number;
  type: StockMovementType;
  reason?: string;
  referenceId?: string;
  userId?: string | null;
}

/**
 * The only place where Product.stockQuantity changes (DATABASE.md §7, §18).
 * Every change updates the product and writes a StockMovement in the caller's
 * transaction. Decreases use a conditional UPDATE, so concurrent orders can
 * never push stock below zero; the CHECK constraint is a second safety net.
 *
 * Policy: stock is deducted when an order is created and returned when the
 * order is cancelled (docs/database-notes.md).
 */
@Injectable()
export class InventoryService {
  async apply(db: DbClient, change: StockChange) {
    if (!Number.isInteger(change.delta) || change.delta === 0) {
      throw AppError.badRequest('INVALID_QUANTITY', 'Stock change must be a non-zero integer');
    }

    if (change.delta < 0) {
      const updated = await db.product.updateMany({
        where: { id: change.productId, stockQuantity: { gte: -change.delta } },
        data: { stockQuantity: { increment: change.delta } },
      });
      if (updated.count !== 1) {
        const product = await db.product.findUnique({
          where: { id: change.productId },
          select: { stockQuantity: true },
        });
        if (!product) throw AppError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
        throw AppError.conflict('INSUFFICIENT_STOCK', 'Not enough stock', {
          productId: change.productId,
          available: product.stockQuantity,
          requested: -change.delta,
        });
      }
    } else {
      await db.product.update({
        where: { id: change.productId },
        data: { stockQuantity: { increment: change.delta } },
      });
    }

    return db.stockMovement.create({
      data: {
        productId: change.productId,
        type: change.type,
        quantity: change.delta,
        reason: change.reason,
        referenceId: change.referenceId,
        createdById: change.userId ?? null,
      },
    });
  }

  /**
   * Deducts stock for the tracked products of an order. Items are processed in
   * a stable order (by product id) to avoid deadlocks between concurrent orders.
   */
  async deductForOrder(
    db: DbClient,
    orderId: string,
    items: { productId: string; quantity: number; trackInventory: boolean }[],
    userId: string
  ) {
    const tracked = items
      .filter((item) => item.trackInventory)
      .sort((a, b) => a.productId.localeCompare(b.productId));
    for (const item of tracked) {
      await this.apply(db, {
        productId: item.productId,
        delta: -item.quantity,
        type: StockMovementType.OUT,
        reason: 'order',
        referenceId: orderId,
        userId,
      });
    }
  }

  /** Returns exactly what was deducted for the order (based on its OUT movements). */
  async returnForOrder(db: DbClient, orderId: string, userId: string | null) {
    const movements = await db.stockMovement.groupBy({
      by: ['productId'],
      where: {
        referenceId: orderId,
        type: { in: [StockMovementType.OUT, StockMovementType.RETURN] },
      },
      _sum: { quantity: true },
      orderBy: { productId: 'asc' },
    });
    for (const movement of movements) {
      const netDeducted = -(movement._sum.quantity ?? 0);
      if (netDeducted > 0) {
        await this.apply(db, {
          productId: movement.productId,
          delta: netDeducted,
          type: StockMovementType.RETURN,
          reason: 'order_cancelled',
          referenceId: orderId,
          userId,
        });
      }
    }
  }
}
