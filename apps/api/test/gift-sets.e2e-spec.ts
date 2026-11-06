import { ProductStatus } from '@prisma/client';
import request from 'supertest';

import {
  createProduct,
  createTestApp,
  createUser,
  loginAs,
  resetDatabase,
  TestContext,
} from './utils';

describe('Gift set builder (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(async () => resetDatabase(ctx.prisma));
  afterAll(async () => ctx.app.close());

  const http = () => request(ctx.app.getHttpServer());

  it('prices a set from the current catalog (guest), merging duplicate lines', async () => {
    const navat = await createProduct(ctx.prisma, { name: 'Нават', priceAmount: 10000 });
    const kymyz = await createProduct(ctx.prisma, {
      name: 'Кымыз',
      priceAmount: 30000,
      stockQuantity: 1,
    });
    const draft = await createProduct(ctx.prisma, { status: ProductStatus.DRAFT });

    const res = await http()
      .post('/api/gift-sets/quote?locale=ru')
      .send({
        items: [
          { productId: navat.id, quantity: 1 },
          { productId: navat.id, quantity: 2 },
          { productId: kymyz.id, quantity: 2 },
          { productId: draft.id, quantity: 1 },
        ],
      })
      .expect(200);

    expect(res.body.items).toHaveLength(2);
    const navatLine = res.body.items.find(
      (l: { product: { id: string } }) => l.product.id === navat.id
    );
    expect(navatLine.quantity).toBe(3);
    expect(navatLine.lineTotal.amount).toBe(30000);
    const kymyzLine = res.body.items.find(
      (l: { product: { id: string } }) => l.product.id === kymyz.id
    );
    expect(kymyzLine.issue).toBe('INSUFFICIENT_STOCK');
    expect(res.body.unavailable).toEqual([draft.id]);
    expect(res.body.total).toEqual({ amount: 90000, currency: 'KGS' });
    expect(res.body.canOrder).toBe(false);

    // The price comes from the database at the time of the request.
    await ctx.prisma.product.update({ where: { id: navat.id }, data: { priceAmount: 12000 } });
    const again = await http()
      .post('/api/gift-sets/quote')
      .send({ items: [{ productId: navat.id, quantity: 1 }] })
      .expect(200);
    expect(again.body.total.amount).toBe(12000);
    expect(again.body.canOrder).toBe(true);
  });

  it('validates the request', async () => {
    await http()
      .post('/api/gift-sets/quote')
      .send({ items: [{ productId: 'nope', quantity: 1 }] })
      .expect(422);
    const product = await createProduct(ctx.prisma);
    await http()
      .post('/api/gift-sets/quote')
      .send({ items: [{ productId: product.id, quantity: 100 }] })
      .expect(422);
  });

  it('signed-in users save, list and delete their own sets only', async () => {
    const navat = await createProduct(ctx.prisma, { priceAmount: 10000 });
    const owner = await createUser(ctx.prisma);
    const other = await createUser(ctx.prisma);
    const agent = await loginAs(ctx.app, owner.email);

    await http()
      .post('/api/gift-sets')
      .send({ name: 'Той', items: [{ productId: navat.id, quantity: 2 }] })
      .expect(401);

    const created = await agent
      .post('/api/gift-sets')
      .send({ name: '  Той үчүн  ', items: [{ productId: navat.id, quantity: 2 }] })
      .expect(201);
    expect(created.body.name).toBe('Той үчүн');
    expect(created.body.total.amount).toBe(20000);

    await agent.post('/api/gift-sets').send({ name: 'Бош', items: [] }).expect(422);

    const list = await agent.get('/api/gift-sets').expect(200);
    expect(list.body).toHaveLength(1);

    const otherAgent = await loginAs(ctx.app, other.email);
    expect((await otherAgent.get('/api/gift-sets').expect(200)).body).toHaveLength(0);
    await otherAgent.delete(`/api/gift-sets/${created.body.id}`).expect(404);

    await agent.delete(`/api/gift-sets/${created.body.id}`).expect(204);
    expect((await agent.get('/api/gift-sets').expect(200)).body).toHaveLength(0);
  });

  it('rejects saving unavailable products and limits the number of sets', async () => {
    const owner = await createUser(ctx.prisma);
    const agent = await loginAs(ctx.app, owner.email);
    const draft = await createProduct(ctx.prisma, { status: ProductStatus.DRAFT });
    const res = await agent
      .post('/api/gift-sets')
      .send({ name: 'X', items: [{ productId: draft.id, quantity: 1 }] });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('PRODUCT_NOT_FOUND');

    const product = await createProduct(ctx.prisma);
    for (let i = 0; i < 20; i++) {
      await ctx.prisma.giftSet.create({
        data: {
          userId: owner.id,
          name: `Set ${i}`,
          items: { create: [{ productId: product.id, quantity: 1 }] },
        },
      });
    }
    const over = await agent
      .post('/api/gift-sets')
      .send({ name: 'One more', items: [{ productId: product.id, quantity: 1 }] });
    expect(over.status).toBe(409);
    expect(over.body.code).toBe('GIFT_SET_LIMIT');
  });
});
