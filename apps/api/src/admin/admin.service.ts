import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, ProductStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const LOW_STOCK_THRESHOLD = 5;

/** Admin dashboard (TZ §14). Revenue counts completed orders only; amounts are in tyiyn. */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(days: number) {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const [
      byStatus,
      revenue,
      revenuePeriod,
      usersTotal,
      activeProducts,
      lowStock,
      popular,
      latestOrders,
      daily,
    ] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, completedAt: { gte: since } },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.product.count({ where: { status: ProductStatus.ACTIVE, deletedAt: null } }),
      this.prisma.product.findMany({
        where: {
          deletedAt: null,
          trackInventory: true,
          stockQuantity: { lte: LOW_STOCK_THRESHOLD },
        },
        select: {
          id: true,
          sku: true,
          stockQuantity: true,
          translations: { where: { locale: 'ru' }, select: { name: true } },
        },
        orderBy: { stockQuantity: 'asc' },
        take: 10,
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { productId: { not: null }, order: { status: { not: OrderStatus.CANCELLED } } },
        _sum: { quantity: true, totalPriceAmount: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.order.findMany({
        where: { status: OrderStatus.PENDING },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          totalAmount: true,
          currency: true,
          createdAt: true,
        },
      }),
      this.prisma.$queryRaw<{ day: Date; orders: bigint; revenue: bigint | null }[]>(Prisma.sql`
          SELECT date_trunc('day', created_at) AS day,
                 count(*) AS orders,
                 sum(total_amount) FILTER (WHERE status = 'COMPLETED') AS revenue
          FROM orders
          WHERE created_at >= ${since} AND status <> 'CANCELLED'
          GROUP BY 1
          ORDER BY 1`),
    ]);

    const popularNames = await this.prisma.orderItem.findMany({
      where: { productId: { in: popular.map((p) => p.productId as string) } },
      distinct: ['productId'],
      orderBy: { createdAt: 'desc' },
      select: { productId: true, productName: true },
    });
    const nameById = new Map(popularNames.map((p) => [p.productId, p.productName]));

    const counts = Object.fromEntries(Object.values(OrderStatus).map((s) => [s, 0])) as Record<
      OrderStatus,
      number
    >;
    for (const row of byStatus) counts[row.status] = row._count._all;

    const dailyByDay = new Map(daily.map((d) => [d.day.toISOString().slice(0, 10), d]));
    const salesByDay = Array.from({ length: days }, (_, i) => {
      const date = new Date(since);
      date.setUTCDate(since.getUTCDate() + i);
      const key = date.toISOString().slice(0, 10);
      const row = dailyByDay.get(key);
      return { date: key, orders: Number(row?.orders ?? 0), revenue: Number(row?.revenue ?? 0) };
    });

    return {
      currency: 'KGS',
      orders: {
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        byStatus: counts,
        new: counts.PENDING,
      },
      revenue: {
        total: revenue._sum.totalAmount ?? 0,
        period: {
          days,
          amount: revenuePeriod._sum.totalAmount ?? 0,
          completedOrders: revenuePeriod._count._all,
        },
      },
      usersTotal,
      activeProducts,
      popularProducts: popular.map((p) => ({
        productId: p.productId,
        name: nameById.get(p.productId) ?? null,
        quantity: p._sum.quantity ?? 0,
        revenue: p._sum.totalPriceAmount ?? 0,
      })),
      lowStock: lowStock.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.translations[0]?.name ?? p.sku,
        stockQuantity: p.stockQuantity,
      })),
      latestNewOrders: latestOrders,
      salesByDay,
    };
  }
}
