import { Module } from '@nestjs/common';

import { GiftSetsModule } from '../gift-sets/gift-sets.module';

import { AdminAiController, AiController } from './ai.controller';
import { AiService } from './ai.service';
import { CatalogToolsService } from './tools/catalog-tools.service';

@Module({
  imports: [GiftSetsModule],
  controllers: [AiController, AdminAiController],
  providers: [AiService, CatalogToolsService],
})
export class AiModule {}
