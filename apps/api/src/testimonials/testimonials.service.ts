import { Injectable } from '@nestjs/common';
import { Prisma, Testimonial } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { AppError } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';

import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';

const ORDER: Prisma.TestimonialOrderByWithRelationInput[] = [
  { sortOrder: 'asc' },
  { reviewDate: 'desc' },
  { createdAt: 'desc' },
];

/** Customer testimonials of the home page carousel, managed in the admin panel. */
@Injectable()
export class TestimonialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async publicList() {
    const items = await this.prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: ORDER,
      take: 30,
    });
    return items.map((item) => this.toPublic(item));
  }

  async adminList() {
    const items = await this.prisma.testimonial.findMany({ orderBy: ORDER });
    return items.map((item) => this.toAdmin(item));
  }

  async create(adminId: string, dto: CreateTestimonialDto) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.testimonial.create({
        data: {
          authorName: dto.authorName,
          text: dto.text,
          rating: dto.rating,
          reviewDate: new Date(`${dto.reviewDate}T00:00:00Z`),
          photoUrl: dto.photoUrl ?? null,
          avatarUrl: dto.avatarUrl ?? null,
          productName: dto.productName || null,
          instagramUrl: dto.instagramUrl ?? null,
          isPublished: dto.isPublished ?? true,
          isDemo: dto.isDemo ?? false,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'testimonial.create',
        entityType: 'Testimonial',
        entityId: item.id,
      });
      return this.toAdmin(item);
    });
  }

  async update(adminId: string, id: string, dto: UpdateTestimonialDto) {
    return this.prisma.$transaction(async (tx) => {
      const exists = await tx.testimonial.findUnique({ where: { id }, select: { id: true } });
      if (!exists) throw AppError.notFound('TESTIMONIAL_NOT_FOUND', 'Testimonial not found');
      const item = await tx.testimonial.update({
        where: { id },
        data: {
          authorName: dto.authorName,
          text: dto.text,
          rating: dto.rating,
          reviewDate: dto.reviewDate ? new Date(`${dto.reviewDate}T00:00:00Z`) : undefined,
          // null clears a value, undefined keeps it
          photoUrl: dto.photoUrl,
          avatarUrl: dto.avatarUrl,
          productName: dto.productName === '' ? null : dto.productName,
          instagramUrl: dto.instagramUrl,
          isPublished: dto.isPublished,
          isDemo: dto.isDemo,
          sortOrder: dto.sortOrder,
        },
      });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'testimonial.update',
        entityType: 'Testimonial',
        entityId: id,
      });
      return this.toAdmin(item);
    });
  }

  async remove(adminId: string, id: string) {
    await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.testimonial.deleteMany({ where: { id } });
      if (deleted.count === 0)
        throw AppError.notFound('TESTIMONIAL_NOT_FOUND', 'Testimonial not found');
      await this.audit.log(tx, {
        userId: adminId,
        action: 'testimonial.delete',
        entityType: 'Testimonial',
        entityId: id,
      });
    });
  }

  private toPublic(item: Testimonial) {
    return {
      id: item.id,
      authorName: item.authorName,
      text: item.text,
      rating: item.rating,
      reviewDate: item.reviewDate.toISOString().slice(0, 10),
      photoUrl: item.photoUrl,
      avatarUrl: item.avatarUrl,
      productName: item.productName,
      instagramUrl: item.instagramUrl,
      isDemo: item.isDemo,
    };
  }

  private toAdmin(item: Testimonial) {
    return {
      ...this.toPublic(item),
      isPublished: item.isPublished,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
