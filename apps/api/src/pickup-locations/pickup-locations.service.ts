import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PickupLocationsService {
  constructor(private prisma: PrismaService) {}

  getAll() {
    return this.prisma.pickupLocation.findMany({
      where: { isActive: true },
    });
  }

  getById(id: string) {
    return this.prisma.pickupLocation.findUnique({
      where: { id },
    });
  }

  create(data: any) {
    return this.prisma.pickupLocation.create({
      data,
    });
  }

  update(id: string, data: any) {
    return this.prisma.pickupLocation.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.pickupLocation.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
