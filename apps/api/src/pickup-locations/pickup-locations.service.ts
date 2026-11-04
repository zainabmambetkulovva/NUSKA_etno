import { Injectable } from '@nestjs/common';
import { PickupLocation, Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { AppError } from '../common/errors';
import { normalizePhone } from '../common/utils/phone';
import { PrismaService } from '../prisma/prisma.service';

import { CreatePickupLocationDto, UpdatePickupLocationDto } from './dto/pickup-locations.dto';

function toView(location: PickupLocation) {
  return {
    ...location,
    latitude: location.latitude?.toNumber() ?? null,
    longitude: location.longitude?.toNumber() ?? null,
  };
}

@Injectable()
export class PickupLocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async listActive() {
    const locations = await this.prisma.pickupLocation.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return locations.map((l) => {
      const { isActive: _a, createdAt: _c, updatedAt: _u, sortOrder: _s, ...rest } = toView(l);
      return rest;
    });
  }

  async adminList() {
    const locations = await this.prisma.pickupLocation.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return locations.map(toView);
  }

  async create(adminId: string, dto: CreatePickupLocationDto) {
    const data = this.toData(dto) as Prisma.PickupLocationCreateInput;
    return this.prisma.$transaction(async (tx) => {
      const location = await tx.pickupLocation.create({ data });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'pickup_location.create',
        entityType: 'PickupLocation',
        entityId: location.id,
        metadata: { name: location.name, address: location.address },
      });
      return toView(location);
    });
  }

  /** Orders keep their own snapshot of name and address, so editing here never changes history. */
  async update(adminId: string, id: string, dto: UpdatePickupLocationDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.pickupLocation.findUnique({ where: { id } });
      if (!existing)
        throw AppError.notFound('PICKUP_LOCATION_NOT_FOUND', 'Pickup location not found');
      const location = await tx.pickupLocation.update({ where: { id }, data: this.toData(dto) });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'pickup_location.update',
        entityType: 'PickupLocation',
        entityId: id,
        metadata: { fields: Object.keys(dto) },
      });
      return toView(location);
    });
  }

  private toData(dto: UpdatePickupLocationDto): Prisma.PickupLocationUpdateInput {
    let phone: string | null | undefined = dto.phone;
    if (dto.phone) {
      phone = normalizePhone(dto.phone);
      if (!phone) throw AppError.badRequest('INVALID_PHONE', 'Phone number is not valid');
    }
    const decimal = (value: number | null | undefined) =>
      value === undefined ? undefined : value === null ? null : new Prisma.Decimal(value);
    return {
      name: dto.name,
      address: dto.address,
      description: dto.description,
      phone,
      latitude: decimal(dto.latitude),
      longitude: decimal(dto.longitude),
      openingHours: dto.openingHours,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    };
  }
}
