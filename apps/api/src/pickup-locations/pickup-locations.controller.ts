import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';

import { CreatePickupLocationDto, UpdatePickupLocationDto } from './dto/pickup-locations.dto';
import { PickupLocationsService } from './pickup-locations.service';

@ApiTags('pickup')
@Public()
@Controller('pickup-locations')
export class PickupLocationsController {
  constructor(private readonly locations: PickupLocationsService) {}

  @Get()
  list() {
    return this.locations.listActive();
  }
}

/** Locations are deactivated (isActive=false) rather than deleted: orders reference them. */
@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin/pickup-locations')
export class AdminPickupLocationsController {
  constructor(private readonly locations: PickupLocationsService) {}

  @Get()
  list() {
    return this.locations.adminList();
  }

  @Post()
  create(@CurrentUser() admin: AuthenticatedUser, @Body() dto: CreatePickupLocationDto) {
    return this.locations.create(admin.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePickupLocationDto
  ) {
    return this.locations.update(admin.id, id, dto);
  }
}
