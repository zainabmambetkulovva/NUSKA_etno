import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { CartService } from '../cart/cart.service';
import { AppError } from '../common/errors';
import { Locale, pickTranslation } from '../common/utils/locale';
import { paginate } from '../common/utils/pagination';
import { normalizePhone } from '../common/utils/phone';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { DbClient } from '../prisma/prisma.types';

import { AdminOrdersQueryDto, ChangeOrderStatusDto, CreateOrderDto } from './dto/orders.dto';
import { canTransition, CUSTOMER_CANCELLABLE } from './order-status';

const MAX_PICKUP_AHEAD_MS = 30 * 24 * 60 * 60 * 1000;

const orderDetailInclude = {
  items: {
    orderBy: { createdAt: 'asc' },
    include: {
      product: {
        select: {
          slug: true,
          status: true,
          deletedAt: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
        },
      },
      review: { select: { id: true, status: true } },
    },
  },
  statusHistory: { orderBy: { createdAt: 'asc' } },
  payments: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.OrderInclude;

type OrderDetailSource = Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>;

const adminOrderInclude = {
  ...orderDetailInclude,
  statusHistory: {
    orderBy: { createdAt: 'asc' },
    include: { changedBy: { select: { id: true, email: true, firstName: true, lastName: true } } },
  },
  user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
} satisfies Prisma.OrderInclude;

interface Actor {
  userId: string;
  isAdmin: boolean;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly cart: CartService
  ) {}

  // --- Checkout (TZ §9) ----------------------------------------------------

  /**
   * Creates an order from the user's cart in one transaction:
   * lock cart → validate products and pickup point → snapshot items →
   * deduct stock → clear cart → notification. Any failure rolls back everything.
   */
  async create(userId: string, dto: CreateOrderDto, requestLocale: Locale) {
    const locale = dto.locale ?? requestLocale;
    const customerPhone = normalizePhone(dto.customerPhone);
    if (!customerPhone) throw AppError.badRequest('INVALID_PHONE', 'Phone number is not valid');

    let pickupTime: Date | null = null;
    if (dto.pickupTime) {
      pickupTime = new Date(dto.pickupTime);
      const now = Date.now();
      if (pickupTime.getTime() <= now || pickupTime.getTime() > now + MAX_PICKUP_AHEAD_MS) {
        throw AppError.badRequest(
          'INVALID_PICKUP_TIME',
          'Pickup time must be in the future (up to 30 days)'
        );
      }
    }

    const orderId = await this.prisma.$transaction(
      async (tx) => {
        // Serialises concurrent checkouts of the same cart (double click, two tabs).
        const locked = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM carts WHERE user_id = ${userId}::uuid FOR UPDATE`;
        const cartId = locked[0]?.id;
        const cartItems = cartId
          ? await tx.cartItem.findMany({
              where: { cartId },
              orderBy: { createdAt: 'asc' },
              include: { product: { include: { translations: true } } },
            })
          : [];
        if (cartItems.length === 0) throw AppError.badRequest('CART_EMPTY', 'The cart is empty');

        for (const { product } of cartItems) {
          if (product.status !== 'ACTIVE' || product.deletedAt) {
            throw AppError.conflict(
              'PRODUCT_UNAVAILABLE',
              'A product in the cart is no longer available',
              {
                productId: product.id,
              }
            );
          }
        }

        const pickup = await tx.pickupLocation.findFirst({
          where: { id: dto.pickupLocationId, isActive: true },
        });
        if (!pickup)
          throw AppError.badRequest(
            'PICKUP_LOCATION_UNAVAILABLE',
            'Pickup location is not available'
          );

        const items = cartItems.map(({ product, quantity }) => ({
          productId: product.id,
          productName: pickTranslation(product.translations, locale)?.name ?? product.sku,
          productSku: product.sku,
          quantity,
          unitPriceAmount: product.priceAmount,
          totalPriceAmount: product.priceAmount * quantity,
        }));
        const subtotal = items.reduce((sum, item) => sum + item.totalPriceAmount, 0);

        const order = await tx.order.create({
          data: {
            userId,
            status: OrderStatus.PENDING,
            subtotalAmount: subtotal,
            totalAmount: subtotal,
            currency: 'KGS',
            locale,
            customerName: dto.customerName,
            customerPhone,
            customerEmail: dto.customerEmail ?? null,
            pickupLocationId: pickup.id,
            pickupLocationName: pickup.name,
            pickupLocationAddress: pickup.address,
            pickupTime,
            customerComment: dto.customerComment || null,
            items: { create: items },
            statusHistory: {
              create: { oldStatus: null, newStatus: OrderStatus.PENDING, changedById: userId },
            },
          },
        });

        await this.inventory.deductForOrder(
          tx,
          order.id,
          cartItems.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
            trackInventory: product.trackInventory,
          })),
          userId
        );
        await tx.cartItem.deleteMany({ where: { cartId } });
        await this.notifications.notifyOrderStatus(tx, order, OrderStatus.PENDING);
        return order.id;
      },
      { timeout: 15_000 }
    );

    return this.getForUser(userId, orderId);
  }

  // --- Customer ----------------------------------------------------------

  async listForUser(userId: string, limit: number, offset: number) {
    const where = { userId };
    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: orderDetailInclude,
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(orders.map(toOrderView), total, limit, offset);
  }

  async getForUser(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderDetailInclude,
    });
    if (!order) throw AppError.notFound('ORDER_NOT_FOUND', 'Order not found');
    return toOrderView(order);
  }

  async cancelByUser(userId: string, orderId: string, comment?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { status: true },
    });
    if (!order) throw AppError.notFound('ORDER_NOT_FOUND', 'Order not found');
    if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
      throw AppError.conflict(
        'ORDER_NOT_CANCELLABLE',
        'This order can no longer be cancelled online',
        {
          status: order.status,
        }
      );
    }
    await this.prisma.$transaction((tx) =>
      this.transition(tx, orderId, OrderStatus.CANCELLED, { userId, isAdmin: false }, comment)
    );
    return this.getForUser(userId, orderId);
  }

  /** "Повтор заказа": puts the still-available products of an old order into the cart. */
  async repeat(userId: string, orderId: string, locale: Locale) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) throw AppError.notFound('ORDER_NOT_FOUND', 'Order not found');

    const withProduct = order.items.filter((item) => item.productId !== null);
    const result = await this.cart.merge(
      userId,
      {
        items: withProduct.map((item) => ({
          productId: item.productId as string,
          quantity: item.quantity,
        })),
      },
      locale
    );
    const removedProducts = order.items
      .filter((item) => item.productId === null)
      .map((item) => ({ productName: item.productName, reason: 'UNAVAILABLE' as const }));
    return { cart: result.cart, skipped: [...result.skipped, ...removedProducts] };
  }

  // --- Admin (TZ §14) ----------------------------------------------------

  async adminList(query: AdminOrdersQueryDto) {
    const and: Prisma.OrderWhereInput[] = [];
    if (query.status) and.push({ status: query.status });
    if (query.from) and.push({ createdAt: { gte: new Date(query.from) } });
    if (query.to) and.push({ createdAt: { lte: new Date(query.to) } });
    if (query.search) {
      const or: Prisma.OrderWhereInput[] = [
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { customerPhone: { contains: query.search.replace(/[\s\-()]/g, '') } },
        { customerEmail: { contains: query.search, mode: 'insensitive' } },
      ];
      const asNumber = Number(query.search.replace(/^№|^#/, ''));
      if (Number.isInteger(asNumber) && asNumber > 0 && asNumber < 2 ** 31)
        or.push({ orderNumber: asNumber });
      and.push({ OR: or });
    }
    const where: Prisma.OrderWhereInput = { AND: and };
    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(orders, total, query.limit, query.offset);
  }

  async adminGet(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: adminOrderInclude,
    });
    if (!order) throw AppError.notFound('ORDER_NOT_FOUND', 'Order not found');
    return {
      ...toOrderView(order),
      user: order.user,
      statusHistory: order.statusHistory.map((h) => ({
        oldStatus: h.oldStatus,
        newStatus: h.newStatus,
        comment: h.comment,
        createdAt: h.createdAt,
        changedBy: h.changedBy,
      })),
      allowedTransitions: allowedTransitions(order.status),
    };
  }

  async adminChangeStatus(adminId: string, orderId: string, dto: ChangeOrderStatusDto) {
    await this.prisma.$transaction((tx) =>
      this.transition(tx, orderId, dto.status, { userId: adminId, isAdmin: true }, dto.comment)
    );
    return this.adminGet(orderId);
  }

  // --- Status machine ----------------------------------------------------

  /**
   * Applies one status transition. The UPDATE is conditional on the current
   * status, so two concurrent changes cannot both succeed.
   */
  private async transition(
    db: DbClient,
    orderId: string,
    to: OrderStatus,
    actor: Actor,
    comment?: string
  ) {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) throw AppError.notFound('ORDER_NOT_FOUND', 'Order not found');
    if (!canTransition(order.status, to)) {
      throw AppError.conflict(
        'INVALID_STATUS_TRANSITION',
        `Cannot change status from ${order.status} to ${to}`,
        {
          from: order.status,
          to,
          allowed: allowedTransitions(order.status),
        }
      );
    }

    const now = new Date();
    const updated = await db.order.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status: to,
        ...(to === OrderStatus.CONFIRMED ? { confirmedAt: now } : {}),
        ...(to === OrderStatus.COMPLETED ? { completedAt: now } : {}),
        ...(to === OrderStatus.CANCELLED ? { cancelledAt: now } : {}),
      },
    });
    if (updated.count !== 1) {
      throw AppError.conflict(
        'ORDER_STATUS_CHANGED',
        'The order was changed by someone else, reload and try again'
      );
    }

    await db.orderStatusHistory.create({
      data: {
        orderId,
        oldStatus: order.status,
        newStatus: to,
        changedById: actor.userId,
        comment: comment || null,
      },
    });
    if (to === OrderStatus.CANCELLED) {
      await this.inventory.returnForOrder(db, orderId, actor.userId);
    }
    await this.notifications.notifyOrderStatus(db, order, to);
    if (actor.isAdmin) {
      await this.audit.log(db, {
        userId: actor.userId,
        action: 'order.status_change',
        entityType: 'Order',
        entityId: orderId,
        metadata: {
          orderNumber: order.orderNumber,
          from: order.status,
          to,
          comment: comment ?? null,
        },
      });
    }
  }
}

function allowedTransitions(status: OrderStatus): OrderStatus[] {
  return (Object.values(OrderStatus) as OrderStatus[]).filter((to) => canTransition(status, to));
}

/** Order as shown to its owner (TZ §11 "История заказов"). */
function toOrderView(order: OrderDetailSource) {
  const money = (amount: number) => ({ amount, currency: order.currency });
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: money(order.subtotalAmount),
    total: money(order.totalAmount),
    locale: order.locale,
    customer: { name: order.customerName, phone: order.customerPhone, email: order.customerEmail },
    pickup: {
      locationId: order.pickupLocationId,
      name: order.pickupLocationName,
      address: order.pickupLocationAddress,
      time: order.pickupTime,
    },
    comment: order.customerComment,
    items: order.items.map((item) => {
      const productVisible =
        item.product && item.product.status === 'ACTIVE' && !item.product.deletedAt;
      return {
        id: item.id,
        productId: item.productId,
        productSlug: productVisible ? item.product!.slug : null,
        image: productVisible ? (item.product!.images[0] ?? null) : null,
        name: item.productName,
        sku: item.productSku,
        quantity: item.quantity,
        unitPrice: money(item.unitPriceAmount),
        totalPrice: money(item.totalPriceAmount),
        review: item.review,
      };
    }),
    statusHistory: order.statusHistory.map((h) => ({
      oldStatus: h.oldStatus,
      newStatus: h.newStatus,
      comment: h.comment,
      createdAt: h.createdAt,
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      method: p.method,
      status: p.status,
      amount: money(p.amount),
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    })),
    canCancel: CUSTOMER_CANCELLABLE.includes(order.status),
    createdAt: order.createdAt,
    confirmedAt: order.confirmedAt,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
  };
}
