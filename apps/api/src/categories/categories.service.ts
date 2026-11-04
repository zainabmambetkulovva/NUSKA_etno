import { Injectable } from '@nestjs/common';
import { Category, CategoryTranslation, Prisma, ProductStatus } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { AppError } from '../common/errors';
import { Locale, pickTranslation } from '../common/utils/locale';
import { assertAllLocales, assertUniqueLocales } from '../common/validation';
import { PrismaService } from '../prisma/prisma.service';
import { DbClient } from '../prisma/prisma.types';

import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';

type CategoryWithTranslations = Category & { translations: CategoryTranslation[] };

export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
  children: CategoryNode[];
}

const PUBLIC_WHERE: Prisma.CategoryWhereInput = { deletedAt: null, isActive: true };

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  // --- Public ------------------------------------------------------------

  /** Active categories as a tree. A child is shown only if its parent is visible too. */
  async getTree(locale: Locale): Promise<CategoryNode[]> {
    const categories = await this.prisma.category.findMany({
      where: PUBLIC_WHERE,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        translations: true,
        _count: {
          select: {
            products: { where: { product: { status: ProductStatus.ACTIVE, deletedAt: null } } },
          },
        },
      },
    });

    const nodes = new Map<string, CategoryNode & { parentId: string | null }>();
    for (const category of categories) {
      const translation = pickTranslation(category.translations, locale);
      nodes.set(category.id, {
        id: category.id,
        parentId: category.parentId,
        slug: category.slug,
        name: translation?.name ?? category.slug,
        description: translation?.description ?? null,
        imageUrl: category.imageUrl,
        sortOrder: category.sortOrder,
        productCount: category._count.products,
        children: [],
      });
    }

    const roots: CategoryNode[] = [];
    for (const node of nodes.values()) {
      if (!node.parentId) roots.push(node);
      else nodes.get(node.parentId)?.children.push(node);
    }
    const strip = (node: CategoryNode & { parentId?: string | null }): CategoryNode => {
      const { parentId: _parentId, ...rest } = node;
      return { ...rest, children: rest.children.map(strip) };
    };
    return roots.map(strip);
  }

  async getBySlug(slug: string, locale: Locale) {
    const category = await this.prisma.category.findFirst({
      where: { slug, ...PUBLIC_WHERE },
      include: {
        translations: true,
        parent: { include: { translations: true } },
        children: {
          where: PUBLIC_WHERE,
          orderBy: { sortOrder: 'asc' },
          include: { translations: true },
        },
      },
    });
    if (!category) throw AppError.notFound('CATEGORY_NOT_FOUND', 'Category not found');

    const brief = (c: CategoryWithTranslations) => ({
      id: c.id,
      slug: c.slug,
      name: pickTranslation(c.translations, locale)?.name ?? c.slug,
      imageUrl: c.imageUrl,
    });
    const translation = pickTranslation(category.translations, locale);
    return {
      ...brief(category),
      description: translation?.description ?? null,
      parent:
        category.parent && !category.parent.deletedAt && category.parent.isActive
          ? brief(category.parent)
          : null,
      children: category.children.map(brief),
    };
  }

  /** Ids of the category with this slug and all its visible descendants (for catalog filtering). */
  async resolveSubtreeIds(slug: string): Promise<string[]> {
    const all = await this.prisma.category.findMany({
      where: PUBLIC_WHERE,
      select: { id: true, slug: true, parentId: true },
    });
    const root = all.find((c) => c.slug === slug);
    if (!root) return [];
    const ids = [root.id];
    for (let i = 0; i < ids.length; i++) {
      for (const c of all) if (c.parentId === ids[i]) ids.push(c.id);
    }
    return ids;
  }

  // --- Admin -------------------------------------------------------------

  adminList() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { translations: true, _count: { select: { products: true, children: true } } },
    });
  }

  async adminGet(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: { translations: true },
    });
    if (!category) throw AppError.notFound('CATEGORY_NOT_FOUND', 'Category not found');
    return category;
  }

  async create(adminId: string, dto: CreateCategoryDto) {
    assertUniqueLocales(dto.translations);
    if (dto.isActive !== false)
      assertAllLocales(
        dto.translations.map((t) => t.locale),
        'Active category'
      );

    return this.prisma.$transaction(async (tx) => {
      if (dto.parentId) await this.assertParentExists(tx, dto.parentId);
      const category = await tx.category.create({
        data: {
          slug: dto.slug,
          parentId: dto.parentId ?? null,
          imageUrl: dto.imageUrl ?? null,
          sortOrder: dto.sortOrder ?? 0,
          isActive: dto.isActive ?? true,
          translations: {
            create: dto.translations.map((t) => ({
              locale: t.locale,
              name: t.name,
              description: t.description ?? null,
            })),
          },
        },
        include: { translations: true },
      });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'category.create',
        entityType: 'Category',
        entityId: category.id,
        metadata: { slug: category.slug },
      });
      return category;
    });
  }

  async update(adminId: string, id: string, dto: UpdateCategoryDto) {
    if (dto.translations) assertUniqueLocales(dto.translations);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.category.findFirst({
        where: { id, deletedAt: null },
        include: { translations: true },
      });
      if (!existing) throw AppError.notFound('CATEGORY_NOT_FOUND', 'Category not found');

      if (dto.parentId) await this.assertNoCycle(tx, id, dto.parentId);

      const finalLocales = new Set([
        ...existing.translations.map((t) => t.locale),
        ...(dto.translations ?? []).map((t) => t.locale),
      ]);
      if (dto.isActive ?? existing.isActive) assertAllLocales(finalLocales, 'Active category');

      for (const t of dto.translations ?? []) {
        await tx.categoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: id, locale: t.locale } },
          update: { name: t.name, description: t.description ?? null },
          create: {
            categoryId: id,
            locale: t.locale,
            name: t.name,
            description: t.description ?? null,
          },
        });
      }

      const category = await tx.category.update({
        where: { id },
        data: {
          slug: dto.slug,
          parentId: dto.parentId,
          imageUrl: dto.imageUrl,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
        include: { translations: true },
      });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'category.update',
        entityType: 'Category',
        entityId: id,
        metadata: { changes: JSON.parse(JSON.stringify(dto)) as Prisma.InputJsonValue },
      });
      return category;
    });
  }

  /** Soft delete. Not allowed while the category still has sub-categories. */
  async remove(adminId: string, id: string) {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.category.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw AppError.notFound('CATEGORY_NOT_FOUND', 'Category not found');

      const children = await tx.category.count({ where: { parentId: id, deletedAt: null } });
      if (children > 0) {
        throw AppError.conflict('CATEGORY_HAS_CHILDREN', 'Move or delete the sub-categories first');
      }
      await tx.category.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'category.delete',
        entityType: 'Category',
        entityId: id,
        metadata: { slug: existing.slug },
      });
    });
  }

  private async assertParentExists(db: DbClient, parentId: string) {
    const parent = await db.category.findFirst({ where: { id: parentId, deletedAt: null } });
    if (!parent) throw AppError.badRequest('PARENT_NOT_FOUND', 'Parent category not found');
  }

  private async assertNoCycle(db: DbClient, id: string, newParentId: string) {
    if (newParentId === id)
      throw AppError.badRequest('CATEGORY_CYCLE', 'A category cannot be its own parent');
    await this.assertParentExists(db, newParentId);
    let current: string | null = newParentId;
    const visited = new Set<string>();
    while (current) {
      if (current === id)
        throw AppError.badRequest(
          'CATEGORY_CYCLE',
          'A category cannot be moved into its own subtree'
        );
      if (visited.has(current)) break;
      visited.add(current);
      const parent: { parentId: string | null } | null = await db.category.findUnique({
        where: { id: current },
        select: { parentId: true },
      });
      current = parent?.parentId ?? null;
    }
  }
}
