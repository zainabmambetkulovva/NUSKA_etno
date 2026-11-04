import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PickupLocationsService } from './pickup-locations.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/role.decorator';
import { UserRole } from '@prisma/client';

@Controller('pickup-locations')
export class PickupLocationsController {
  constructor(private readonly pickupLocationsService: PickupLocationsService) {}

  @Get()
  getAll() {
    return this.pickupLocationsService.getAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.pickupLocationsService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role(UserRole.ADMIN)
  create(@Body() createDto: any) {
    return this.pickupLocationsService.create(createDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.pickupLocationsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.pickupLocationsService.remove(id);
  }
}
