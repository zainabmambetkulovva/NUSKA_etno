import { Module } from '@nestjs/common';

import { GiftSetsController } from './gift-sets.controller';
import { GiftSetsService } from './gift-sets.service';

@Module({
  controllers: [GiftSetsController],
  providers: [GiftSetsService],
  exports: [GiftSetsService],
})
export class GiftSetsModule {}
