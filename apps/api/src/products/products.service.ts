import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(limit?: number, offset?: number) {
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        translations: {
          where: { locale: 'ru' },
        },
        images: {
          where: { isPrimary: true },
        },
      },
      take: limit,
      skip: offset,
    });
  }

  findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        translations: {
          where: { locale: 'ru' },
        },
        images: true,
        categories: {
          include: {
            category: {
              include: {
                translations: {
                  where: { locale: 'ru' },
                },
              },
            },
          },
        },
      },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.product.findUnique({
      where: { slug },
      include: {
        translations: {
          where: { locale: 'ru' },
        },
        images: true,
        categories: {
          include: {
            category: {
              include: {
                translations: {
                  where: { locale: 'ru' },
                },
              },
            },
          },
        },
      },
    });
  }

  create(data: any) {
    return this.prisma.product.create({
      data,
    });
  }

  update(id: string, data: any) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
