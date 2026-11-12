import { PaymentMethod, PaymentStatus, ProductStatus, UserRole } from '@prisma/client';
import request from 'supertest';

import { PaymentsService } from '../src/payments/payments.service';

import {
  Agent,
  createCategory,
  createPickupLocation,
  createProduct,
  createTestApp,
  createUser,
  loginAs,
  resetDatabase,
  TestContext,
} from './utils';

describe('Catalog, admin catalog and payments (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(async () => resetDatabase(ctx.prisma));
  afterAll(async () => ctx.app.close());

  const http = () => request(ctx.app.getHttpServer());
  const adminAgent = async (): Promise<{ agent: Agent; id: string }> => {
    const admin = await createUser(ctx.prisma, UserRole.ADMIN);
    return { agent: await loginAs(ctx.app, admin.email), id: admin.id };
  };

  describe('public catalog', () => {
    it('filters by price in som, sorts by name and searches descriptions', async () => {
      const cheap = await createProduct(ctx.prisma, { name: 'Бал', priceAmount: 10000 });
      await createProduct(ctx.prisma, { name: 'Айран', priceAmount: 20000 });
      await createProduct(ctx.prisma, { name: 'Ведро', priceAmount: 30000 });
      await ctx.prisma.productTranslation.updateMany({
        where: { productId: cheap.id, locale: 'ru' },
        data: { shortDescription: 'Горный мёд с разнотравья' },
      });

      const priced = await http()
        .get('/api/products?locale=ru&minPrice=150&maxPrice=300')
        .expect(200);
      expect(priced.body.data.map((p: { name: string }) => p.name).sort()).toEqual(
        ['Ведро', 'Айран'].sort()
      );

      const byName = await http().get('/api/products?locale=ru&sort=name&limit=2').expect(200);
      expect(byName.body.data.map((p: { name: string }) => p.name)).toEqual(['Айран', 'Бал']);
      expect(byName.body.meta.total).toBe(3);

      const found = await http().get('/api/products?locale=ru&search=разнотравья').expect(200);
      expect(found.body.data.map((p: { id: string }) => p.id)).toEqual([cheap.id]);

      await http().get('/api/products?minPrice=-1').expect(422);
    });

    it('shows only active, non-deleted products, localised', async () => {
      await createProduct(ctx.prisma, { name: 'Нават', nameKy: 'Нават (ky)' });
      await createProduct(ctx.prisma, { name: 'Черновик', status: ProductStatus.DRAFT });
      const deleted = await createProduct(ctx.prisma, { name: 'Удалён' });
      await ctx.prisma.product.update({
        where: { id: deleted.id },
        data: { deletedAt: new Date() },
      });

      const ru = (await http().get('/api/products?locale=ru').expect(200)).body;
      expect(ru.meta.total).toBe(1);
      expect(ru.data[0].name).toBe('Нават');
      const ky = (await http().get('/api/products?locale=ky').expect(200)).body;
      expect(ky.data[0].name).toBe('Нават (ky)');
      const byDefault = (await http().get('/api/products').expect(200)).body;
      expect(byDefault.data[0].name).toBe('Нават (ky)'); // Kyrgyz is the default language
      const byHeader = (
        await http().get('/api/products').set('Accept-Language', 'ru-RU,ru;q=0.9').expect(200)
      ).body;
      expect(byHeader.data[0].name).toBe('Нават');

      await http().get(`/api/products/${deleted.slug}`).expect(404);
    });

    it('searches, filters by category (with sub-categories), stock and sorts by price', async () => {
      const sweets = await createCategory(ctx.prisma, 'sweets');
      const navatCat = await createCategory(ctx.prisma, 'navat', sweets.id);
      const dairy = await createCategory(ctx.prisma, 'dairy');
      await createProduct(ctx.prisma, {
        name: 'Нават 0.5',
        priceAmount: 10000,
        categoryIds: [navatCat.id],
      });
      await createProduct(ctx.prisma, {
        name: 'Халва',
        priceAmount: 5000,
        categoryIds: [sweets.id],
        stockQuantity: 0,
      });
      await createProduct(ctx.prisma, {
        name: 'Кымыз',
        nameKy: 'Кымыз',
        priceAmount: 30000,
        categoryIds: [dairy.id],
      });

      const names = (res: request.Response) => res.body.data.map((p: { name: string }) => p.name);

      expect(
        names(await http().get('/api/products').query({ locale: 'ru', search: 'НАВАТ' }))
      ).toEqual(['Нават 0.5']);
      expect(
        names(
          await http()
            .get('/api/products')
            .query({ locale: 'ru', category: 'sweets', sort: 'price_asc' })
        )
      ).toEqual(['Халва', 'Нават 0.5']);
      expect(
        names(
          await http()
            .get('/api/products')
            .query({ locale: 'ru', category: 'sweets', inStock: 'true' })
        )
      ).toEqual(['Нават 0.5']);
      expect(
        names(await http().get('/api/products').query({ locale: 'ru', sort: 'price_desc' }))[0]
      ).toBe('Кымыз');
      expect(
        (await http().get('/api/products').query({ locale: 'ru', category: 'missing' })).body.meta
          .total
      ).toBe(0);
      await http().get('/api/products').query({ locale: 'ru', sort: 'random' }).expect(422);
      await http().get('/api/products').query({ locale: 'ru', limit: 1000 }).expect(422);

      const tree = (await http().get('/api/categories').expect(200)).body;
      const sweetsNode = tree.find((c: { slug: string }) => c.slug === 'sweets');
      expect(sweetsNode.children.map((c: { slug: string }) => c.slug)).toEqual(['navat']);
    });

    it('returns product details with related products', async () => {
      const cat = await createCategory(ctx.prisma);
      const main = await createProduct(ctx.prisma, { categoryIds: [cat.id] });
      const sibling = await createProduct(ctx.prisma, { categoryIds: [cat.id] });
      await createProduct(ctx.prisma);

      const detail = (await http().get(`/api/products/${main.slug}`).expect(200)).body;
      expect(detail).toMatchObject({
        id: main.id,
        inStock: true,
        availableQuantity: 10,
        characteristics: [],
      });
      const related = (await http().get(`/api/products/${main.slug}/related`).expect(200)).body;
      expect(related.map((p: { id: string }) => p.id)).toEqual([sibling.id]);
    });
  });

  describe('admin catalog', () => {
    const translations = [
      {
        locale: 'ru',
        name: 'Сары май',
        characteristics: [{ name: 'Вес', value: '500 г' }],
        ingredients: 'Молочный жир',
        benefits: 'Натуральный продукт\n\n  Не подгорает при жарке  \n',
      },
      { locale: 'ky', name: 'Сары май' },
    ];

    it('creates a product with initial stock, records the movement and audit', async () => {
      const { agent, id: adminId } = await adminAgent();
      const cat = await createCategory(ctx.prisma);

      const res = await agent
        .post('/api/admin/products')
        .send({
          sku: 'sary-mai',
          slug: 'sary-mai',
          priceAmount: 23500,
          status: 'ACTIVE',
          initialStock: 12,
          categoryIds: [cat.id],
          translations,
          units: [{ unitName: 'Банка', quantityValue: 0.5, quantityUnit: 'кг' }],
        })
        .expect(201);
      expect(res.body).toMatchObject({ sku: 'SARY-MAI', stockQuantity: 12, status: 'ACTIVE' });
      expect(res.body.units[0].quantityValue).toBe(0.5);

      const movement = await ctx.prisma.stockMovement.findFirstOrThrow({
        where: { productId: res.body.id },
      });
      expect(movement).toMatchObject({ type: 'IN', quantity: 12, createdById: adminId });
      expect(
        await ctx.prisma.auditLog.count({
          where: { entityId: res.body.id, action: 'product.create' },
        })
      ).toBe(1);

      const publicDetail = (await http().get('/api/products/sary-mai?locale=ru').expect(200)).body;
      expect(publicDetail.characteristics).toEqual([{ name: 'Вес', value: '500 г' }]);
      // Benefits are stored one per line and served as a clean list; empty lines are dropped.
      expect(publicDetail.ingredients).toBe('Молочный жир');
      expect(publicDetail.benefits).toEqual(['Натуральный продукт', 'Не подгорает при жарке']);
      const ky = (await http().get('/api/products/sary-mai?locale=ky').expect(200)).body;
      expect(ky.benefits).toEqual([]);
    });

    it('stores the 3D packaging choice and shows it on the product page', async () => {
      const { agent } = await adminAgent();
      const product = await createProduct(ctx.prisma);
      await agent
        .patch(`/api/admin/products/${product.id}`)
        .send({ packaging3d: 'BOTTLE' })
        .expect(200);
      expect((await http().get(`/api/products/${product.slug}`).expect(200)).body.packaging3d).toBe(
        'BOTTLE'
      );
      await agent
        .patch(`/api/admin/products/${product.id}`)
        .send({ packaging3d: 'SPHERE' })
        .expect(422);
      await agent
        .patch(`/api/admin/products/${product.id}`)
        .send({ packaging3d: null })
        .expect(200);
      expect(
        (await http().get(`/api/products/${product.slug}`).expect(200)).body.packaging3d
      ).toBeNull();
    });

    it('refuses to publish a product without both translations and rejects unknown fields', async () => {
      const { agent } = await adminAgent();
      const base = { sku: 'X1', slug: 'x1', priceAmount: 100 };

      const missing = await agent
        .post('/api/admin/products')
        .send({ ...base, status: 'ACTIVE', translations: [{ locale: 'ru', name: 'Только RU' }] })
        .expect(400);
      expect(missing.body).toMatchObject({ code: 'MISSING_TRANSLATIONS', missingLocales: ['ky'] });

      const draft = await agent
        .post('/api/admin/products')
        .send({ ...base, translations: [{ locale: 'ru', name: 'Только RU' }] })
        .expect(201);
      await agent
        .patch(`/api/admin/products/${draft.body.id}`)
        .send({ status: 'ACTIVE' })
        .expect(400);
      await agent
        .patch(`/api/admin/products/${draft.body.id}`)
        .send({ stockQuantity: 999 })
        .expect(422);
      await agent
        .post('/api/admin/products')
        .send({ ...base, sku: 'X2', slug: 'Bad Slug', translations })
        .expect(422);
      await agent
        .post('/api/admin/products')
        .send({ ...base, priceAmount: -1, translations })
        .expect(422);
    });

    it('audits price changes and adjusts stock without going negative', async () => {
      const { agent } = await adminAgent();
      const product = await createProduct(ctx.prisma, { priceAmount: 10000, stockQuantity: 3 });

      await agent
        .patch(`/api/admin/products/${product.id}`)
        .send({ priceAmount: 11500 })
        .expect(200);
      const priceLog = await ctx.prisma.auditLog.findFirstOrThrow({
        where: { action: 'product.price_change' },
      });
      expect(priceLog.metadata).toMatchObject({ from: 10000, to: 11500 });

      const tooMuch = await agent
        .post(`/api/admin/products/${product.id}/stock`)
        .send({ type: 'ADJUSTMENT', quantity: -4, reason: 'inventory' })
        .expect(409);
      expect(tooMuch.body.code).toBe('INSUFFICIENT_STOCK');
      await agent
        .post(`/api/admin/products/${product.id}/stock`)
        .send({ type: 'IN', quantity: -1, reason: 'x' })
        .expect(400);

      const ok = await agent
        .post(`/api/admin/products/${product.id}/stock`)
        .send({ type: 'IN', quantity: 7, reason: 'поставка' })
        .expect(201);
      expect(ok.body.stockQuantity).toBe(10);
      const history = (
        await agent.get(`/api/admin/products/${product.id}/stock-movements`).expect(200)
      ).body;
      expect(history.data[0]).toMatchObject({ type: 'IN', quantity: 7, reason: 'поставка' });
    });

    it('soft-deletes a product: hidden from catalog, removed from carts, order history kept', async () => {
      const { agent } = await adminAgent();
      const product = await createProduct(ctx.prisma);
      const user = await createUser(ctx.prisma);
      const customer = await loginAs(ctx.app, user.email);
      await customer
        .post('/api/cart/items')
        .send({ productId: product.id, quantity: 1 })
        .expect(201);

      await agent.delete(`/api/admin/products/${product.id}`).expect(204);
      expect((await http().get('/api/products').expect(200)).body.meta.total).toBe(0);
      expect((await customer.get('/api/cart').expect(200)).body.items).toHaveLength(0);
      expect(await ctx.prisma.product.count()).toBe(1);
    });

    it('prevents category cycles and deleting a category with children', async () => {
      const { agent } = await adminAgent();
      const parent = await createCategory(ctx.prisma);
      const child = await createCategory(ctx.prisma, undefined, parent.id);

      const cycle = await agent
        .patch(`/api/admin/categories/${parent.id}`)
        .send({ parentId: child.id })
        .expect(400);
      expect(cycle.body.code).toBe('CATEGORY_CYCLE');
      const del = await agent.delete(`/api/admin/categories/${parent.id}`).expect(409);
      expect(del.body.code).toBe('CATEGORY_HAS_CHILDREN');
      await agent.delete(`/api/admin/categories/${child.id}`).expect(204);
      await agent.delete(`/api/admin/categories/${parent.id}`).expect(204);
    });

    it('reports that image storage is not configured instead of pretending to upload', async () => {
      const { agent } = await adminAgent();
      const product = await createProduct(ctx.prisma);
      const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
      const res = await agent
        .post(`/api/admin/products/${product.id}/images`)
        .attach('file', png, { filename: 'a.png', contentType: 'image/png' })
        .expect(503);
      expect(res.body.code).toBe('STORAGE_NOT_CONFIGURED');
      expect(await ctx.prisma.productImage.count()).toBe(0);
    });
  });

  describe('payments', () => {
    it('applies a provider event once and ignores duplicates and invalid transitions', async () => {
      const user = await createUser(ctx.prisma);
      const pickup = await createPickupLocation(ctx.prisma);
      const order = await ctx.prisma.order.create({
        data: {
          userId: user.id,
          subtotalAmount: 10000,
          totalAmount: 10000,
          customerName: 'X',
          customerPhone: '+996555000000',
          pickupLocationId: pickup.id,
          pickupLocationName: pickup.name,
          pickupLocationAddress: pickup.address,
        },
      });
      const payment = await ctx.prisma.payment.create({
        data: {
          orderId: order.id,
          method: PaymentMethod.ONLINE,
          amount: 10000,
          provider: 'test-provider',
          providerPaymentId: 'pay_1',
        },
      });
      const payments = ctx.app.get(PaymentsService);
      const event = {
        provider: 'test-provider',
        externalEventId: 'evt_1',
        providerPaymentId: 'pay_1',
        eventType: 'payment.succeeded',
        status: PaymentStatus.PAID,
        amount: 10000,
        payload: { id: 'evt_1' },
      };

      expect(await payments.processProviderEvent(event)).toMatchObject({
        result: 'applied',
        status: 'PAID',
      });
      expect(await payments.processProviderEvent(event)).toEqual({ result: 'duplicate' });
      expect(
        await payments.processProviderEvent({
          ...event,
          externalEventId: 'evt_2',
          status: PaymentStatus.FAILED,
        })
      ).toMatchObject({ result: 'ignored' });
      expect(
        await payments.processProviderEvent({
          ...event,
          externalEventId: 'evt_3',
          status: PaymentStatus.REFUNDED,
          amount: 1,
        })
      ).toEqual({ result: 'ignored', reason: 'AMOUNT_MISMATCH' });

      const stored = await ctx.prisma.payment.findUniqueOrThrow({
        where: { id: payment.id },
        include: { events: true },
      });
      expect(stored.status).toBe('PAID');
      expect(stored.paidAt).not.toBeNull();
      expect(stored.events).toHaveLength(3);
      expect(stored.events.every((e) => e.processedAt !== null)).toBe(true);
    });
  });
});
