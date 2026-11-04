import { Injectable, Logger } from '@nestjs/common';
import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';

import { AppError } from '../common/errors';
import { paginate } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';

import { canTransitionPayment } from './payment-status';

/** Normalised event produced by a provider adapter after it has verified the webhook signature. */
export interface ProviderPaymentEvent {
  provider: string;
  externalEventId: string;
  providerPaymentId: string;
  eventType: string;
  status: PaymentStatus;
  amount?: number;
  payload: Prisma.InputJsonValue;
}

export type ProcessResult =
  | { result: 'applied'; paymentId: string; status: PaymentStatus }
  | { result: 'duplicate' }
  | { result: 'ignored'; reason: string };

/**
 * Payments (TZ §13). The payment provider is not chosen yet, so there is no
 * public webhook endpoint and no online checkout: nothing here can mark a
 * payment as paid based on data from the client.
 *
 * When a provider is chosen, its adapter verifies the webhook signature and
 * passes a normalised event to `processProviderEvent`, which is idempotent:
 * PaymentEvent(provider, externalEventId) is unique, so a webhook delivered
 * twice is applied once.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processProviderEvent(event: ProviderPaymentEvent): Promise<ProcessResult> {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: {
          provider_providerPaymentId: {
            provider: event.provider,
            providerPaymentId: event.providerPaymentId,
          },
        },
      });
      if (!payment) throw AppError.notFound('PAYMENT_NOT_FOUND', 'Payment not found');

      const inserted = await tx.paymentEvent.createMany({
        data: [
          {
            paymentId: payment.id,
            provider: event.provider,
            externalEventId: event.externalEventId,
            eventType: event.eventType,
            payload: event.payload,
          },
        ],
        skipDuplicates: true,
      });
      if (inserted.count === 0) return { result: 'duplicate' as const };

      const markProcessed = () =>
        tx.paymentEvent.update({
          where: {
            provider_externalEventId: {
              provider: event.provider,
              externalEventId: event.externalEventId,
            },
          },
          data: { processedAt: new Date() },
        });

      if (event.amount !== undefined && event.amount !== payment.amount) {
        this.logger.warn(
          `Payment ${payment.id}: amount mismatch (${event.amount} != ${payment.amount})`
        );
        await markProcessed();
        return { result: 'ignored' as const, reason: 'AMOUNT_MISMATCH' };
      }
      if (payment.status === event.status || !canTransitionPayment(payment.status, event.status)) {
        await markProcessed();
        return {
          result: 'ignored' as const,
          reason: `TRANSITION_${payment.status}_TO_${event.status}`,
        };
      }

      const updated = await tx.payment.updateMany({
        where: { id: payment.id, status: payment.status },
        data: {
          status: event.status,
          ...(event.status === PaymentStatus.PAID ? { paidAt: new Date() } : {}),
        },
      });
      if (updated.count !== 1)
        throw AppError.conflict('PAYMENT_STATUS_CHANGED', 'Payment was changed concurrently');
      await markProcessed();
      return { result: 'applied' as const, paymentId: payment.id, status: event.status };
    });
  }

  async adminList(query: {
    limit: number;
    offset: number;
    status?: PaymentStatus;
    method?: PaymentMethod;
  }) {
    const where = { status: query.status, method: query.method };
    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
        include: { order: { select: { id: true, orderNumber: true, status: true } } },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return paginate(payments, total, query.limit, query.offset);
  }
}
