import { Module } from '@nestjs/common';

import { AdminPaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [AdminPaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
