import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async addToFavorites(userId: string, productId: string) {
    return this.prisma.favorite.create({
      data: { userId, productId },
    });
  }

  async removeFromFavorites(userId: string, productId: string) {
    return this.prisma.favorite.delete({
      where: { userId_productId: { userId, productId } },
    });
  }

  async getFavorites(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            translations: {
              where: { locale: 'ru' },
            },
            images: {
              where: { isPrimary: true },
            },
          },
        },
      },
    });
  }

  async isInFavorites(userId: string, productId: string) {
    return this.prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });
  }
}
