import { Module } from '@nestjs/common';

import {
  AdminPickupLocationsController,
  PickupLocationsController,
} from './pickup-locations.controller';
import { PickupLocationsService } from './pickup-locations.service';

@Module({
  controllers: [PickupLocationsController, AdminPickupLocationsController],
  providers: [PickupLocationsService],
})
export class PickupLocationsModule {}
