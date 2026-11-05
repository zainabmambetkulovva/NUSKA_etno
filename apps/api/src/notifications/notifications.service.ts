import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { AppError } from '../common/errors';
import { DEFAULT_LOCALE, isLocale } from '../common/utils/locale';
import { paginate } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { DbClient } from '../prisma/prisma.types';

import { orderNotification } from './notification.templates';

/**
 * In-app notifications (TZ §17). Other channels (e-mail, SMS, Telegram) can be
 * added here once the company chooses them.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Call inside the transaction that changes the order status. */
  notifyOrderStatus(
    db: DbClient,
    order: {
      id: string;
      userId: string;
      orderNumber: number;
      locale: string;
      pickupLocationAddress: string;
    },
    status: OrderStatus
  ) {
    const locale = isLocale(order.locale) ? order.locale : DEFAULT_LOCALE;
    const content = orderNotification(
      status,
      locale,
      order.orderNumber,
      order.pickupLocationAddress
    );
    return db.notification.create({
      data: { userId: order.userId, relatedOrderId: order.id, locale, ...content },
    });
  }

  async list(userId: string, limit: number, offset: number, unreadOnly: boolean) {
    const where = { userId, ...(unreadOnly ? { isRead: false } : {}) };
    const [rows, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { relatedOrder: { select: { id: true, orderNumber: true, status: true } } },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { ...paginate(rows, total, limit, offset), unreadCount };
  }

  async markRead(userId: string, id: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    if (result.count === 0)
      throw AppError.notFound('NOTIFICATION_NOT_FOUND', 'Notification not found');
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.notification.deleteMany({ where: { id, userId } });
    if (result.count === 0)
      throw AppError.notFound('NOTIFICATION_NOT_FOUND', 'Notification not found');
  }
}
