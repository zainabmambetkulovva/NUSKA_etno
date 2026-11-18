import { Module } from '@nestjs/common';

import { PaymentsPublicController } from './finik/finik.controller';
import { FinikService } from './finik/finik.service';
import { AdminPaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [AdminPaymentsController, PaymentsPublicController],
  providers: [PaymentsService, FinikService],
  exports: [PaymentsService, FinikService],
})
export class PaymentsModule {}
