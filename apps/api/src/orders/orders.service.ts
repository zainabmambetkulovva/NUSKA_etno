import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeliveryMethod, OrderStatus, PaymentMethod, Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { CartService } from '../cart/cart.service';
import { AppError } from '../common/errors';
import { Locale, pickTranslation } from '../common/utils/locale';
import { paginate } from '../common/utils/pagination';
import { normalizePhone } from '../common/utils/phone';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FinikService } from '../payments/finik/finik.service';
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
  private readonly logger = new Logger(OrdersService.name);
  private readonly webUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly cart: CartService,
    private readonly finik: FinikService,
    config: ConfigService
  ) {
    this.webUrl = (config.get<string>('WEB_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  // --- Checkout (TZ §9) ----------------------------------------------------

  /**
   * Creates an order from the user's cart in one transaction:
   * lock cart → validate products and pickup point → snapshot items →
   * deduct stock → clear cart → notification. Any failure rolls back everything.
   */
  async create(userId: string, dto: CreateOrderDto, requestLocale: Locale) {
    const locale = dto.locale ?? requestLocale;
    // Online payment only when Finik is configured on the server.
    const online = dto.paymentMethod === PaymentMethod.ONLINE;
    if (online && !this.finik.configured)
      throw AppError.badRequest(
        'ONLINE_PAYMENT_UNAVAILABLE',
        'Online payment is not available yet'
      );
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

        const delivery = dto.deliveryMethod === DeliveryMethod.DELIVERY;
        const pickup = delivery
          ? null
          : await tx.pickupLocation.findFirst({
              where: { id: dto.pickupLocationId, isActive: true },
            });
        if (!delivery && !pickup)
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
            deliveryMethod: delivery ? DeliveryMethod.DELIVERY : DeliveryMethod.PICKUP,
            deliveryCity: delivery ? dto.deliveryCity! : null,
            deliveryAddress: delivery ? dto.deliveryAddress! : null,
            deliveryTime: delivery && dto.deliveryTime ? dto.deliveryTime : null,
            paymentMethod: online ? PaymentMethod.ONLINE : PaymentMethod.CASH,
            pickupLocationId: pickup?.id ?? null,
            pickupLocationName: pickup?.name ?? null,
            pickupLocationAddress: pickup?.address ?? null,
            pickupTime: delivery ? null : pickupTime,
            customerComment: dto.customerComment || null,
            items: { create: items },
            statusHistory: {
              create: { oldStatus: null, newStatus: OrderStatus.PENDING, changedById: userId },
            },
          },
        });

        if (online) {
          // Finik takes whole som (a test amount, when set, replaces the real one)
          const amount = this.finik.testAmount ?? subtotal;
          if (amount % 100 !== 0)
            throw AppError.badRequest('ONLINE_PAYMENT_UNAVAILABLE', 'Amount is not whole som');
          await tx.payment.create({
            data: {
              orderId: order.id,
              method: PaymentMethod.ONLINE,
              amount,
              currency: 'KGS',
              provider: 'finik',
              providerPaymentId: this.finik.newPaymentId(),
            },
          });
        }

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

    const view = await this.getForUser(userId, orderId);
    return online ? { ...view, paymentUrl: await this.paymentLink(orderId, locale) } : view;
  }

  /**
   * Finik payment page for the order's pending online payment (a new payment
   * attempt when the previous one failed). null when Finik does not answer:
   * the customer can try again from the order page.
   */
  private async paymentLink(orderId: string, locale: Locale): Promise<string | null> {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { payments: { orderBy: { createdAt: 'desc' } } },
    });
    let payment = order.payments.find((p) => p.provider === 'finik' && p.status === 'PENDING');
    if (!payment)
      payment = await this.prisma.payment.create({
        data: {
          orderId,
          method: PaymentMethod.ONLINE,
          amount: this.finik.testAmount ?? order.totalAmount,
          currency: order.currency,
          provider: 'finik',
          providerPaymentId: this.finik.newPaymentId(),
        },
      });
    try {
      return await this.finik.createPayment({
        paymentId: payment.providerPaymentId!,
        amount: payment.amount,
        description: `NUSKA_etno №${order.orderNumber}`,
        redirectUrl: `${this.webUrl}/${locale}/checkout/success?order=${orderId}`,
        locale,
      });
    } catch (error) {
      this.logger.error(`order ${orderId}: Finik payment link failed: ${(error as Error).message}`);
      return null;
    }
  }

  /** «Оплатить онлайн» again for an own unpaid online order. */
  async payOnline(userId: string, orderId: string, locale: Locale) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { payments: true },
    });
    if (!order) throw AppError.notFound('ORDER_NOT_FOUND', 'Order not found');
    if (!this.finik.configured || order.paymentMethod !== PaymentMethod.ONLINE)
      throw AppError.badRequest('ONLINE_PAYMENT_UNAVAILABLE', 'Online payment is not available');
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.COMPLETED)
      throw AppError.conflict('ORDER_CLOSED', 'The order is closed');
    if (order.payments.some((p) => p.status === 'PAID'))
      throw AppError.conflict('ALREADY_PAID', 'The order is already paid');
    const paymentUrl = await this.paymentLink(orderId, locale);
    if (!paymentUrl)
      throw AppError.badRequest('PAYMENT_PROVIDER_ERROR', 'The payment provider did not answer');
    return { paymentUrl };
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
    deliveryMethod: order.deliveryMethod,
    paymentMethod: order.paymentMethod,
    delivery:
      order.deliveryMethod === DeliveryMethod.DELIVERY
        ? { city: order.deliveryCity, address: order.deliveryAddress, time: order.deliveryTime }
        : null,
    pickup:
      order.deliveryMethod === DeliveryMethod.PICKUP
        ? {
            locationId: order.pickupLocationId,
            name: order.pickupLocationName,
            address: order.pickupLocationAddress,
            time: order.pickupTime,
          }
        : null,
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
