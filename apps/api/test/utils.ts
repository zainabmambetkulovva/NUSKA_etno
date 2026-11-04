import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, ProductStatus, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

export type Agent = ReturnType<typeof request.agent>;

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
}

export async function createTestApp(): Promise<TestContext> {
  Logger.overrideLogger(['error']);
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

/** Empties every application table (keeps the migrations table). */
export async function resetDatabase(prisma: PrismaService) {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

let counter = 0;
export const unique = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++counter}`;

export const PASSWORD = 'Passw0rd-test';

export async function createUser(prisma: PrismaService, role: UserRole = UserRole.USER) {
  return prisma.user.create({
    data: {
      email: `${unique(role.toLowerCase())}@example.com`,
      passwordHash: await hash(PASSWORD, 4),
      role,
      firstName: 'Test',
      lastName: 'User',
    },
  });
}

/** Returns a supertest agent that keeps the auth cookies. */
export async function loginAs(
  app: INestApplication,
  email: string,
  password = PASSWORD
): Promise<Agent> {
  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/auth/login').send({ email, password }).expect(200);
  return agent;
}

export async function createCategory(
  prisma: PrismaService,
  slug = unique('cat'),
  parentId?: string
) {
  return prisma.category.create({
    data: {
      slug,
      parentId,
      translations: {
        create: [
          { locale: 'ru', name: `Категория ${slug}` },
          { locale: 'ky', name: `Категория KY ${slug}` },
        ],
      },
    },
  });
}

export async function createProduct(
  prisma: PrismaService,
  options: Partial<{
    name: string;
    nameKy: string;
    priceAmount: number;
    stockQuantity: number;
    trackInventory: boolean;
    status: ProductStatus;
    categoryIds: string[];
  }> = {}
) {
  const slug = unique('product');
  const data: Prisma.ProductCreateInput = {
    sku: slug.toUpperCase(),
    slug,
    status: options.status ?? ProductStatus.ACTIVE,
    priceAmount: options.priceAmount ?? 10000,
    stockQuantity: options.stockQuantity ?? 10,
    trackInventory: options.trackInventory ?? true,
    translations: {
      create: [
        { locale: 'ru', name: options.name ?? `Товар ${slug}` },
        { locale: 'ky', name: options.nameKy ?? `Азык ${slug}` },
      ],
    },
    categories: { create: (options.categoryIds ?? []).map((categoryId) => ({ categoryId })) },
  };
  return prisma.product.create({ data });
}

export async function createPickupLocation(prisma: PrismaService) {
  return prisma.pickupLocation.create({ data: { name: 'Test point', address: 'Test address 1' } });
}

export function orderBody(pickupLocationId: string) {
  return { pickupLocationId, customerName: 'Test Customer', customerPhone: '0555123456' };
}
