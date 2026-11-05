import { Injectable } from '@nestjs/common';
import { Prisma, ProductStatus, ReviewStatus, StockMovementType } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { CategoriesService } from '../categories/categories.service';
import { AppError } from '../common/errors';
import { Locale } from '../common/utils/locale';
import { paginate } from '../common/utils/pagination';
import { assertAllLocales, assertUniqueLocales } from '../common/validation';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { DbClient } from '../prisma/prisma.types';
import { UploadsService } from '../uploads/uploads.service';

import {
  AdminProductsQueryDto,
  CreateProductDto,
  ProductsQueryDto,
  ProductTranslationDto,
  ProductUnitDto,
  StockAdjustmentDto,
  UpdateProductDto,
  UpdateProductImageDto,
} from './dto/products.dto';
import {
  productCardInclude,
  productDetailInclude,
  toProductCard,
  toProductDetail,
} from './product.mapper';

/** What the public catalog may show. */
export const PUBLIC_PRODUCT_WHERE: Prisma.ProductWhereInput = {
  status: ProductStatus.ACTIVE,
  deletedAt: null,
};

const adminInclude = {
  translations: true,
  images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
  units: { orderBy: { createdAt: 'asc' } },
  categories: { include: { category: { include: { translations: true } } } },
} satisfies Prisma.ProductInclude;

function translationData(t: ProductTranslationDto) {
  return {
    name: t.name,
    shortDescription: t.shortDescription ?? null,
    description: t.description ?? null,
    ingredients: t.ingredients ?? null,
    storageInstructions: t.storageInstructions ?? null,
    characteristics: t.characteristics
      ? (t.characteristics.map((c) => ({ name: c.name, value: c.value })) as Prisma.InputJsonValue)
      : Prisma.DbNull,
  };
}

function unitData(u: ProductUnitDto) {
  return {
    unitName: u.unitName,
    quantityValue: new Prisma.Decimal(u.quantityValue),
    quantityUnit: u.quantityUnit,
  };
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
    private readonly inventory: InventoryService,
    private readonly uploads: UploadsService,
    private readonly audit: AuditService
  ) {}

  // --- Public catalog (TZ §6, §16) ---------------------------------------

  async list(query: ProductsQueryDto, locale: Locale) {
    const and: Prisma.ProductWhereInput[] = [PUBLIC_PRODUCT_WHERE];

    if (query.search) {
      and.push({
        translations: { some: { name: { contains: query.search, mode: 'insensitive' } } },
      });
    }
    if (query.category) {
      const ids = await this.categories.resolveSubtreeIds(query.category);
      if (ids.length === 0) return paginate([], 0, query.limit, query.offset);
      and.push({ categories: { some: { categoryId: { in: ids } } } });
    }
    if (query.inStock === 'true') {
      and.push({ OR: [{ trackInventory: false }, { stockQuantity: { gt: 0 } }] });
    } else if (query.inStock === 'false') {
      and.push({ trackInventory: true, stockQuantity: 0 });
    }
    if (query.featured) and.push({ isFeatured: query.featured === 'true' });

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = {
      default: [{ sortOrder: 'asc' as const }, { createdAt: 'desc' as const }],
      price_asc: [{ priceAmount: 'asc' as const }, { sortOrder: 'asc' as const }],
      price_desc: [{ priceAmount: 'desc' as const }, { sortOrder: 'asc' as const }],
      popular: [{ orderItems: { _count: 'desc' as const } }, { sortOrder: 'asc' as const }],
      newest: [{ createdAt: 'desc' as const }],
    }[query.sort];

    const where: Prisma.ProductWhereInput = { AND: and };
    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: [...orderBy, { id: 'asc' }],
        take: query.limit,
        skip: query.offset,
        include: productCardInclude,
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(
      products.map((p) => toProductCard(p, locale)),
      total,
      query.limit,
      query.offset
    );
  }

  async getBySlug(slug: string, locale: Locale) {
    const product = await this.prisma.product.findFirst({
      where: { slug, ...PUBLIC_PRODUCT_WHERE },
      include: productDetailInclude,
    });
    if (!product) throw AppError.notFound('PRODUCT_NOT_FOUND', 'Product not found');

    const rating = await this.prisma.review.aggregate({
      where: { productId: product.id, status: ReviewStatus.APPROVED },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return toProductDetail(product, locale, {
      average: rating._avg.rating === null ? null : Math.round(rating._avg.rating * 10) / 10,
      count: rating._count._all,
    });
  }

  /** "Похожие товары": other active products from the same categories. */
  async related(slug: string, locale: Locale, limit = 4) {
    const product = await this.prisma.product.findFirst({
      where: { slug, ...PUBLIC_PRODUCT_WHERE },
      select: { id: true, categories: { select: { categoryId: true } } },
    });
    if (!product) throw AppError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
    const categoryIds = product.categories.map((c) => c.categoryId);
    if (categoryIds.length === 0) return [];

    const related = await this.prisma.product.findMany({
      where: {
        ...PUBLIC_PRODUCT_WHERE,
        id: { not: product.id },
        categories: { some: { categoryId: { in: categoryIds } } },
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      take: limit,
      include: productCardInclude,
    });
    return related.map((p) => toProductCard(p, locale));
  }

  // --- Admin (TZ §14) ----------------------------------------------------

  async adminList(query: AdminProductsQueryDto) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status: query.status,
      ...(query.categoryId ? { categories: { some: { categoryId: query.categoryId } } } : {}),
      ...(query.search
        ? {
            OR: [
              { sku: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
              { translations: { some: { name: { contains: query.search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };
    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: query.limit,
        skip: query.offset,
        include: adminInclude,
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(products.map(this.toAdmin), total, query.limit, query.offset);
  }

  async adminGet(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: adminInclude,
    });
    if (!product) throw AppError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
    return this.toAdmin(product);
  }

  async create(adminId: string, dto: CreateProductDto) {
    assertUniqueLocales(dto.translations);
    const status = dto.status ?? ProductStatus.DRAFT;
    if (status === ProductStatus.ACTIVE)
      assertAllLocales(
        dto.translations.map((t) => t.locale),
        'Active product'
      );

    const id = await this.prisma.$transaction(async (tx) => {
      if (dto.categoryIds?.length) await this.assertCategoriesExist(tx, dto.categoryIds);

      const product = await tx.product.create({
        data: {
          sku: dto.sku,
          slug: dto.slug,
          type: dto.type,
          status,
          priceAmount: dto.priceAmount,
          trackInventory: dto.trackInventory ?? true,
          isFeatured: dto.isFeatured ?? false,
          sortOrder: dto.sortOrder ?? 0,
          translations: {
            create: dto.translations.map((t) => ({ locale: t.locale, ...translationData(t) })),
          },
          categories: {
            create: [...new Set(dto.categoryIds ?? [])].map((categoryId) => ({ categoryId })),
          },
          units: { create: (dto.units ?? []).map(unitData) },
        },
      });

      if (dto.initialStock && dto.initialStock > 0) {
        await this.inventory.apply(tx, {
          productId: product.id,
          delta: dto.initialStock,
          type: StockMovementType.IN,
          reason: 'initial stock',
          userId: adminId,
        });
      }
      await this.audit.log(tx, {
        userId: adminId,
        action: 'product.create',
        entityType: 'Product',
        entityId: product.id,
        metadata: {
          sku: product.sku,
          priceAmount: product.priceAmount,
          initialStock: dto.initialStock ?? 0,
        },
      });
      return product.id;
    });
    return this.adminGet(id);
  }

  async update(adminId: string, id: string, dto: UpdateProductDto) {
    if (dto.translations) assertUniqueLocales(dto.translations);

    await this.prisma.$transaction(async (tx) => {
      const before = await tx.product.findFirst({
        where: { id, deletedAt: null },
        include: { translations: true },
      });
      if (!before) throw AppError.notFound('PRODUCT_NOT_FOUND', 'Product not found');

      const finalStatus = dto.status ?? before.status;
      if (finalStatus === ProductStatus.ACTIVE) {
        const locales = new Set([
          ...before.translations.map((t) => t.locale),
          ...(dto.translations ?? []).map((t) => t.locale),
        ]);
        assertAllLocales(locales, 'Active product');
      }

      for (const t of dto.translations ?? []) {
        await tx.productTranslation.upsert({
          where: { productId_locale: { productId: id, locale: t.locale } },
          update: translationData(t),
          create: { productId: id, locale: t.locale, ...translationData(t) },
        });
      }
      if (dto.categoryIds) {
        await this.assertCategoriesExist(tx, dto.categoryIds);
        await tx.productCategory.deleteMany({ where: { productId: id } });
        await tx.productCategory.createMany({
          data: [...new Set(dto.categoryIds)].map((categoryId) => ({ productId: id, categoryId })),
        });
      }
      if (dto.units) {
        await tx.productUnit.deleteMany({ where: { productId: id } });
        await tx.productUnit.createMany({
          data: dto.units.map((u) => ({ productId: id, ...unitData(u) })),
        });
      }

      const after = await tx.product.update({
        where: { id },
        data: {
          sku: dto.sku,
          slug: dto.slug,
          type: dto.type,
          status: dto.status,
          priceAmount: dto.priceAmount,
          trackInventory: dto.trackInventory,
          isFeatured: dto.isFeatured,
          sortOrder: dto.sortOrder,
        },
      });

      if (before.priceAmount !== after.priceAmount) {
        await this.audit.log(tx, {
          userId: adminId,
          action: 'product.price_change',
          entityType: 'Product',
          entityId: id,
          metadata: { from: before.priceAmount, to: after.priceAmount, currency: after.currency },
        });
      }
      await this.audit.log(tx, {
        userId: adminId,
        action: 'product.update',
        entityType: 'Product',
        entityId: id,
        metadata: { fields: Object.keys(dto) },
      });
    });
    return this.adminGet(id);
  }

  /** Soft delete: hidden from the catalog and removed from carts; order history is untouched. */
  async remove(adminId: string, id: string) {
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id, deletedAt: null } });
      if (!product) throw AppError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
      await tx.product.update({
        where: { id },
        data: { deletedAt: new Date(), status: ProductStatus.ARCHIVED },
      });
      await tx.cartItem.deleteMany({ where: { productId: id } });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'product.delete',
        entityType: 'Product',
        entityId: id,
        metadata: { sku: product.sku },
      });
    });
  }

  async adjustStock(adminId: string, id: string, dto: StockAdjustmentDto) {
    if (dto.type === StockMovementType.IN && dto.quantity < 0) {
      throw AppError.badRequest('INVALID_QUANTITY', 'Use ADJUSTMENT to decrease stock');
    }
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id, deletedAt: null } });
      if (!product) throw AppError.notFound('PRODUCT_NOT_FOUND', 'Product not found');
      const movement = await this.inventory.apply(tx, {
        productId: id,
        delta: dto.quantity,
        type: dto.type,
        reason: dto.reason,
        userId: adminId,
      });
      const updated = await tx.product.findUniqueOrThrow({
        where: { id },
        select: { stockQuantity: true },
      });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'product.stock_change',
        entityType: 'Product',
        entityId: id,
        metadata: {
          type: dto.type,
          delta: dto.quantity,
          from: product.stockQuantity,
          to: updated.stockQuantity,
          reason: dto.reason,
        },
      });
      return { stockQuantity: updated.stockQuantity, movement };
    });
  }

  async stockMovements(id: string, limit: number, offset: number) {
    const where = { productId: id };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { createdBy: { select: { id: true, email: true } } },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return paginate(rows, total, limit, offset);
  }

  // --- Images ------------------------------------------------------------

  async addImage(adminId: string, productId: string, file: Express.Multer.File | undefined) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) throw AppError.notFound('PRODUCT_NOT_FOUND', 'Product not found');

    const stored = await this.uploads.uploadImage(file, 'products');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const count = await tx.productImage.count({ where: { productId } });
        const image = await tx.productImage.create({
          data: {
            productId,
            url: stored.url,
            storageKey: stored.key,
            mimeType: stored.mimeType,
            sizeBytes: stored.sizeBytes,
            sortOrder: count,
            isPrimary: count === 0,
          },
        });
        await this.audit.log(tx, {
          userId: adminId,
          action: 'product.image_add',
          entityType: 'Product',
          entityId: productId,
          metadata: { imageId: image.id },
        });
        return image;
      });
    } catch (error) {
      await this.uploads.delete(stored.key);
      throw error;
    }
  }

  async updateImage(productId: string, imageId: string, dto: UpdateProductImageDto) {
    return this.prisma.$transaction(async (tx) => {
      const image = await tx.productImage.findFirst({ where: { id: imageId, productId } });
      if (!image) throw AppError.notFound('IMAGE_NOT_FOUND', 'Image not found');
      if (dto.isPrimary) {
        await tx.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.productImage.update({
        where: { id: imageId },
        data: {
          alt: dto.alt === undefined ? undefined : dto.alt || null,
          sortOrder: dto.sortOrder,
          isPrimary: dto.isPrimary ? true : undefined,
        },
      });
    });
  }

  async removeImage(adminId: string, productId: string, imageId: string) {
    const removed = await this.prisma.$transaction(async (tx) => {
      const image = await tx.productImage.findFirst({ where: { id: imageId, productId } });
      if (!image) throw AppError.notFound('IMAGE_NOT_FOUND', 'Image not found');
      await tx.productImage.delete({ where: { id: imageId } });
      if (image.isPrimary) {
        const next = await tx.productImage.findFirst({
          where: { productId },
          orderBy: { sortOrder: 'asc' },
        });
        if (next)
          await tx.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
      await this.audit.log(tx, {
        userId: adminId,
        action: 'product.image_delete',
        entityType: 'Product',
        entityId: productId,
        metadata: { imageId },
      });
      return image;
    });
    await this.uploads.delete(removed.storageKey);
  }

  // --- helpers -----------------------------------------------------------

  private async assertCategoriesExist(db: DbClient, ids: string[]) {
    const unique = [...new Set(ids)];
    const found = await db.category.count({ where: { id: { in: unique }, deletedAt: null } });
    if (found !== unique.length)
      throw AppError.badRequest('CATEGORY_NOT_FOUND', 'One or more categories do not exist');
  }

  private toAdmin(product: Prisma.ProductGetPayload<{ include: typeof adminInclude }>) {
    return {
      ...product,
      units: product.units.map((u) => ({ ...u, quantityValue: u.quantityValue.toNumber() })),
      categories: product.categories.map(({ category }) => ({
        id: category.id,
        slug: category.slug,
        translations: category.translations,
      })),
    };
  }
}
