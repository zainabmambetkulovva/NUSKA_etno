import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll(limit?: number, offset?: number) {
    return this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      include: {
        translations: {
          where: { locale: 'ru' },
        },
        products: {
          where: { deletedAt: null },
          include: {
            translations: {
              where: { locale: 'ru' },
            },
          },
        },
      },
      take: limit,
      skip: offset,
    });
  }

  findOne(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        translations: {
          where: { locale: 'ru' },
        },
        products: {
          where: { deletedAt: null },
        },
      },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
      include: {
        translations: {
          where: { locale: 'ru' },
        },
        products: {
          where: { deletedAt: null },
        },
      },
    });
  }

  create(data: any) {
    return this.prisma.category.create({
      data,
    });
  }

  update(id: string, data: any) {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
