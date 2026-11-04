import { Module } from '@nestjs/common';

import { PickupLocationsController } from './pickup-locations.controller';
import { PickupLocationsService } from './pickup-locations.service';

@Module({
  controllers: [PickupLocationsController],
  providers: [PickupLocationsService],
  exports: [PickupLocationsService],
})
export class PickupLocationsModule {}
