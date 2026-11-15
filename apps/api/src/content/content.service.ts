import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { AppError } from '../common/errors';
import { Locale, pickTranslation } from '../common/utils/locale';
import { assertAllLocales, assertUniqueLocales } from '../common/validation';
import { PrismaService } from '../prisma/prisma.service';

import { CreateBannerDto, UpdateBannerDto, UpsertSiteContentDto } from './dto/content.dto';

/** Admin-managed site content (TZ §14 "Управление контентом"). */
@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  // --- Public ------------------------------------------------------------

  async activeBanners(locale: Locale) {
    const now = new Date();
    const banners = await this.prisma.banner.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { translations: true },
    });
    return banners.map((banner) => {
      const t = pickTranslation(banner.translations, locale);
      return {
        id: banner.id,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl,
        title: t?.title ?? '',
        subtitle: t?.subtitle ?? null,
        buttonLabel: t?.buttonLabel ?? null,
      };
    });
  }

  async getByKey(key: string, locale: Locale) {
    const content = await this.prisma.siteContent.findFirst({
      where: { key, isActive: true },
      include: { translations: true },
    });
    if (!content) throw AppError.notFound('CONTENT_NOT_FOUND', 'Content not found');
    const t = pickTranslation(content.translations, locale);
    return {
      key: content.key,
      title: t?.title ?? null,
      body: t?.body ?? null,
      data: content.data,
      updatedAt: content.updatedAt,
    };
  }

  // --- Admin: banners ----------------------------------------------------

  adminBanners() {
    return this.prisma.banner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { translations: true },
    });
  }

  async createBanner(adminId: string, dto: CreateBannerDto) {
    assertUniqueLocales(dto.translations);
    if (dto.isActive !== false)
      assertAllLocales(
        dto.translations.map((t) => t.locale),
        'Active banner'
      );
    this.assertSchedule(dto.startsAt, dto.endsAt);
    return this.prisma.$transaction(async (tx) => {
      const banner = await tx.banner.create({
        data: {
          imageUrl: dto.imageUrl ?? null,
          linkUrl: dto.linkUrl ?? null,
          sortOrder: dto.sortOrder ?? 0,
          isActive: dto.isActive ?? true,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
          translations: {
            create: dto.translations.map((t) => ({
              locale: t.locale,
              title: t.title,
              subtitle: t.subtitle ?? null,
              buttonLabel: t.buttonLabel ?? null,
            })),
          },
        },
        include: { translations: true },
      });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'banner.create',
        entityType: 'Banner',
        entityId: banner.id,
      });
      return banner;
    });
  }

  async updateBanner(adminId: string, id: string, dto: UpdateBannerDto) {
    if (dto.translations) assertUniqueLocales(dto.translations);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.banner.findUnique({
        where: { id },
        include: { translations: true },
      });
      if (!existing) throw AppError.notFound('BANNER_NOT_FOUND', 'Banner not found');

      const startsAt =
        dto.startsAt === undefined
          ? existing.startsAt
          : dto.startsAt
            ? new Date(dto.startsAt)
            : null;
      const endsAt =
        dto.endsAt === undefined ? existing.endsAt : dto.endsAt ? new Date(dto.endsAt) : null;
      this.assertSchedule(startsAt, endsAt);
      if (dto.isActive ?? existing.isActive) {
        assertAllLocales(
          new Set([
            ...existing.translations.map((t) => t.locale),
            ...(dto.translations ?? []).map((t) => t.locale),
          ]),
          'Active banner'
        );
      }
      for (const t of dto.translations ?? []) {
        const data = {
          title: t.title,
          subtitle: t.subtitle ?? null,
          buttonLabel: t.buttonLabel ?? null,
        };
        await tx.bannerTranslation.upsert({
          where: { bannerId_locale: { bannerId: id, locale: t.locale } },
          update: data,
          create: { bannerId: id, locale: t.locale, ...data },
        });
      }
      const banner = await tx.banner.update({
        where: { id },
        data: {
          imageUrl: dto.imageUrl,
          linkUrl: dto.linkUrl,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
          startsAt,
          endsAt,
        },
        include: { translations: true },
      });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'banner.update',
        entityType: 'Banner',
        entityId: id,
        metadata: { fields: Object.keys(dto) },
      });
      return banner;
    });
  }

  async removeBanner(adminId: string, id: string) {
    await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.banner.deleteMany({ where: { id } });
      if (deleted.count === 0) throw AppError.notFound('BANNER_NOT_FOUND', 'Banner not found');
      await this.audit.log(tx, {
        userId: adminId,
        action: 'banner.delete',
        entityType: 'Banner',
        entityId: id,
      });
    });
  }

  // --- Admin: text blocks -------------------------------------------------

  adminContent() {
    return this.prisma.siteContent.findMany({
      orderBy: { key: 'asc' },
      include: { translations: true },
    });
  }

  async upsertContent(adminId: string, key: string, dto: UpsertSiteContentDto) {
    assertUniqueLocales(dto.translations);
    const data =
      dto.data === undefined
        ? undefined
        : dto.data === null
          ? Prisma.DbNull
          : (dto.data as Prisma.InputJsonValue);
    return this.prisma.$transaction(async (tx) => {
      const content = await tx.siteContent.upsert({
        where: { key },
        update: { data, isActive: dto.isActive },
        create: { key, data, isActive: dto.isActive ?? true },
      });
      for (const t of dto.translations) {
        const values = { title: t.title ?? null, body: t.body ?? null };
        await tx.siteContentTranslation.upsert({
          where: { siteContentId_locale: { siteContentId: content.id, locale: t.locale } },
          update: values,
          create: { siteContentId: content.id, locale: t.locale, ...values },
        });
      }
      await this.audit.log(tx, {
        userId: adminId,
        action: 'content.update',
        entityType: 'SiteContent',
        entityId: key,
      });
      return tx.siteContent.findUniqueOrThrow({
        where: { id: content.id },
        include: { translations: true },
      });
    });
  }

  private assertSchedule(startsAt?: string | Date | null, endsAt?: string | Date | null) {
    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      throw AppError.badRequest('INVALID_SCHEDULE', 'startsAt must be before endsAt');
    }
  }
}
