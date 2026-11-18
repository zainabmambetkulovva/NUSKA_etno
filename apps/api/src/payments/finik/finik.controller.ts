import { Body, Controller, Get, Headers, HttpCode, Logger, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentStatus } from '@prisma/client';

import { Public } from '../../common/decorators/public.decorator';
import { AppError } from '../../common/errors';
import { PaymentsService } from '../payments.service';

import { FinikService } from './finik.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsPublicController {
  private readonly logger = new Logger('FinikWebhook');

  constructor(
    private readonly finik: FinikService,
    private readonly payments: PaymentsService
  ) {}

  /** Which payment methods checkout may offer. */
  @Public()
  @Get('methods')
  methods() {
    return {
      cash: true,
      online: this.finik.configured,
      // test mode: the amount (som) charged instead of the order total
      testAmount:
        this.finik.configured && this.finik.testAmount ? this.finik.testAmount / 100 : null,
    };
  }

  /**
   * Finik's payment result. Only a webhook signed by Finik for our account
   * changes a payment; repeated webhooks are applied once.
   */
  @Public()
  @SkipThrottle()
  @Post('finik/webhook')
  @HttpCode(200)
  async finikWebhook(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    const event = this.finik.configured ? this.finik.parseWebhook(body ?? {}, headers) : null;
    if (!event) throw AppError.unauthorized('INVALID_SIGNATURE', 'Webhook is not signed by Finik');
    if (!event.paymentId || event.status === 'UNKNOWN') return { ok: true };
    try {
      const result = await this.payments.processProviderEvent({
        provider: 'finik',
        externalEventId: event.eventId,
        providerPaymentId: event.paymentId,
        eventType: event.status,
        status: event.status === 'SUCCEEDED' ? PaymentStatus.PAID : PaymentStatus.FAILED,
        amount: event.amount ?? undefined,
        payload: event.raw as never,
      });
      this.logger.log(`payment ${event.paymentId}: ${event.status} → ${result.result}`);
    } catch (error) {
      // an unknown payment id: acknowledge, so Finik stops resending it
      this.logger.warn(`payment ${event.paymentId}: ${(error as Error).message}`);
    }
    return { ok: true };
  }
}
