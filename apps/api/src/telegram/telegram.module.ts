import { Global, Module } from '@nestjs/common';

import { AdminTelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Global()
@Module({
  controllers: [AdminTelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
