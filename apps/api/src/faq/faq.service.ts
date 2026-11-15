import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { AppError } from '../common/errors';
import { Locale, pickTranslation } from '../common/utils/locale';
import { assertAllLocales, assertUniqueLocales } from '../common/validation';
import { PrismaService } from '../prisma/prisma.service';

import { CreateFaqItemDto, FaqQueryDto, UpdateFaqItemDto } from './dto/faq.dto';

/** Frequently asked questions, edited in the admin panel (KY/RU). */
@Injectable()
export class FaqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async publicList(locale: Locale, query: FaqQueryDto) {
    const items = await this.prisma.faqItem.findMany({
      where: { isActive: true, ...(query.category ? { category: query.category } : {}) },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { translations: true },
    });
    const search = query.search?.toLocaleLowerCase();
    return items.flatMap((item) => {
      const t = pickTranslation(item.translations, locale);
      if (!t) return [];
      if (
        search &&
        !t.question.toLocaleLowerCase().includes(search) &&
        !t.answer.toLocaleLowerCase().includes(search)
      ) {
        return [];
      }
      return [{ id: item.id, category: item.category, question: t.question, answer: t.answer }];
    });
  }

  adminList() {
    return this.prisma.faqItem.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { translations: { orderBy: { locale: 'asc' } } },
    });
  }

  async create(adminId: string, dto: CreateFaqItemDto) {
    assertUniqueLocales(dto.translations);
    if (dto.isActive !== false)
      assertAllLocales(
        dto.translations.map((t) => t.locale),
        'Active FAQ item'
      );
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.faqItem.create({
        data: {
          category: dto.category ?? 'other',
          sortOrder: dto.sortOrder ?? 0,
          isActive: dto.isActive ?? true,
          translations: { create: dto.translations },
        },
        include: { translations: true },
      });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'faq.create',
        entityType: 'FaqItem',
        entityId: item.id,
      });
      return item;
    });
  }

  async update(adminId: string, id: string, dto: UpdateFaqItemDto) {
    const existing = await this.prisma.faqItem.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!existing) throw AppError.notFound('FAQ_NOT_FOUND', 'FAQ item not found');
    if (dto.translations) assertUniqueLocales(dto.translations);
    const isActive = dto.isActive ?? existing.isActive;
    if (isActive)
      assertAllLocales(
        (dto.translations ?? existing.translations).map((t) => t.locale),
        'Active FAQ item'
      );

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.FaqItemUpdateInput = {
        category: dto.category,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      };
      if (dto.translations) {
        data.translations = {
          deleteMany: {},
          create: dto.translations,
        };
      }
      const item = await tx.faqItem.update({
        where: { id },
        data,
        include: { translations: true },
      });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'faq.update',
        entityType: 'FaqItem',
        entityId: id,
      });
      return item;
    });
  }

  async remove(adminId: string, id: string) {
    await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.faqItem.deleteMany({ where: { id } });
      if (deleted.count === 0) throw AppError.notFound('FAQ_NOT_FOUND', 'FAQ item not found');
      await this.audit.log(tx, {
        userId: adminId,
        action: 'faq.delete',
        entityType: 'FaqItem',
        entityId: id,
      });
    });
  }
}
