import { OrderStatus, UserRole } from '@prisma/client';

import {
  createPickupLocation,
  createProduct,
  createTestApp,
  createUser,
  loginAs,
  orderBody,
  resetDatabase,
  TestContext,
} from './utils';

describe('Cart, checkout and orders (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(async () => resetDatabase(ctx.prisma));
  afterAll(async () => ctx.app.close());

  const stockOf = async (productId: string) =>
    (await ctx.prisma.product.findUniqueOrThrow({ where: { id: productId } })).stockQuantity;

  async function customerWithCart(items: { productId: string; quantity: number }[]) {
    const user = await createUser(ctx.prisma);
    const agent = await loginAs(ctx.app, user.email);
    for (const item of items) await agent.post('/api/cart/items').send(item).expect(201);
    return { user, agent };
  }

  it('creates an order from the cart: snapshot, stock deduction, history, notification, empty cart', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const navat = await createProduct(ctx.prisma, {
      name: 'Нават',
      nameKy: 'Нават KY',
      priceAmount: 10000,
      stockQuantity: 5,
    });
    const kymyz = await createProduct(ctx.prisma, {
      name: 'Кымыз',
      nameKy: 'Кымыз',
      priceAmount: 30000,
      trackInventory: false,
      stockQuantity: 0,
    });
    const { user, agent } = await customerWithCart([
      { productId: navat.id, quantity: 2 },
      { productId: kymyz.id, quantity: 1 },
    ]);

    const res = await agent.post('/api/orders?locale=ky').send(orderBody(pickup.id)).expect(201);
    expect(res.body).toMatchObject({
      status: 'PENDING',
      total: { amount: 50000, currency: 'KGS' },
      customer: { phone: '+996555123456' },
      pickup: { name: 'Test point', address: 'Test address 1' },
      canCancel: true,
    });
    expect(res.body.items.map((i: { name: string }) => i.name).sort()).toEqual([
      'Кымыз',
      'Нават KY',
    ]);
    expect(res.body.statusHistory).toEqual([
      expect.objectContaining({ oldStatus: null, newStatus: 'PENDING' }),
    ]);

    expect(await stockOf(navat.id)).toBe(3);
    expect(await stockOf(kymyz.id)).toBe(0); // not tracked → untouched
    const movements = await ctx.prisma.stockMovement.findMany({
      where: { referenceId: res.body.id },
    });
    expect(movements).toEqual([
      expect.objectContaining({ productId: navat.id, type: 'OUT', quantity: -2 }),
    ]);

    expect((await agent.get('/api/cart').expect(200)).body.items).toHaveLength(0);
    const notifications = await ctx.prisma.notification.findMany({ where: { userId: user.id } });
    expect(notifications).toEqual([
      expect.objectContaining({ type: 'ORDER_CREATED', locale: 'ky' }),
    ]);
  });

  it('keeps the order unchanged when the product price changes later', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const product = await createProduct(ctx.prisma, { priceAmount: 11500 });
    const { agent } = await customerWithCart([{ productId: product.id, quantity: 1 }]);
    const order = (await agent.post('/api/orders').send(orderBody(pickup.id)).expect(201)).body;

    await ctx.prisma.product.update({ where: { id: product.id }, data: { priceAmount: 99900 } });
    const reloaded = (await agent.get(`/api/orders/${order.id}`).expect(200)).body;
    expect(reloaded.total.amount).toBe(11500);
    expect(reloaded.items[0].unitPrice.amount).toBe(11500);
  });

  it('rejects adding more than available and an order exceeding stock, leaving nothing behind', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const product = await createProduct(ctx.prisma, { stockQuantity: 2 });
    const { agent } = await customerWithCart([{ productId: product.id, quantity: 2 }]);

    const tooMany = await agent
      .post('/api/cart/items')
      .send({ productId: product.id, quantity: 1 })
      .expect(409);
    expect(tooMany.body).toMatchObject({ code: 'INSUFFICIENT_STOCK', available: 2, requested: 3 });

    // Stock drops after the item was put in the cart.
    await ctx.prisma.product.update({ where: { id: product.id }, data: { stockQuantity: 1 } });
    const cart = (await agent.get('/api/cart').expect(200)).body;
    expect(cart.items[0].issue).toBe('INSUFFICIENT_STOCK');
    expect(cart.canCheckout).toBe(false);

    const res = await agent.post('/api/orders').send(orderBody(pickup.id)).expect(409);
    expect(res.body.code).toBe('INSUFFICIENT_STOCK');
    expect(await ctx.prisma.order.count()).toBe(0);
    expect(await stockOf(product.id)).toBe(1);
    expect((await agent.get('/api/cart')).body.items).toHaveLength(1);
  });

  it('sells the last item only once when two customers order at the same time', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const product = await createProduct(ctx.prisma, { stockQuantity: 1 });
    const a = await customerWithCart([{ productId: product.id, quantity: 1 }]);
    const b = await customerWithCart([{ productId: product.id, quantity: 1 }]);

    const results = await Promise.all([
      a.agent.post('/api/orders').send(orderBody(pickup.id)),
      b.agent.post('/api/orders').send(orderBody(pickup.id)),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await ctx.prisma.order.count()).toBe(1);
    expect(await stockOf(product.id)).toBe(0);
  });

  it('creates a single order when checkout is submitted twice at once', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const product = await createProduct(ctx.prisma, { stockQuantity: 10 });
    const { agent } = await customerWithCart([{ productId: product.id, quantity: 3 }]);

    const results = await Promise.all([
      agent.post('/api/orders').send(orderBody(pickup.id)),
      agent.post('/api/orders').send(orderBody(pickup.id)),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 400]);
    expect(results.find((r) => r.status === 400)!.body.code).toBe('CART_EMPTY');
    expect(await ctx.prisma.order.count()).toBe(1);
    expect(await stockOf(product.id)).toBe(7);
  });

  it('refuses checkout with an empty cart, an inactive pickup point or an archived product', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const user = await createUser(ctx.prisma);
    const agent = await loginAs(ctx.app, user.email);
    expect((await agent.post('/api/orders').send(orderBody(pickup.id)).expect(400)).body.code).toBe(
      'CART_EMPTY'
    );

    const product = await createProduct(ctx.prisma);
    await agent.post('/api/cart/items').send({ productId: product.id, quantity: 1 }).expect(201);
    await ctx.prisma.pickupLocation.update({ where: { id: pickup.id }, data: { isActive: false } });
    expect((await agent.post('/api/orders').send(orderBody(pickup.id)).expect(400)).body.code).toBe(
      'PICKUP_LOCATION_UNAVAILABLE'
    );

    await ctx.prisma.pickupLocation.update({ where: { id: pickup.id }, data: { isActive: true } });
    await ctx.prisma.product.update({ where: { id: product.id }, data: { status: 'ARCHIVED' } });
    expect((await agent.post('/api/orders').send(orderBody(pickup.id)).expect(409)).body.code).toBe(
      'PRODUCT_UNAVAILABLE'
    );

    await agent
      .post('/api/orders')
      .send({ ...orderBody(pickup.id), customerPhone: 'abc' })
      .expect(400);
    await agent
      .post('/api/orders')
      .send({ ...orderBody(pickup.id), totalAmount: 1 })
      .expect(422);
  });

  it('lets the customer cancel a pending order and returns the stock exactly once', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const product = await createProduct(ctx.prisma, { stockQuantity: 5 });
    const { agent } = await customerWithCart([{ productId: product.id, quantity: 4 }]);
    const order = (await agent.post('/api/orders').send(orderBody(pickup.id)).expect(201)).body;
    expect(await stockOf(product.id)).toBe(1);

    const cancelled = (await agent.post(`/api/orders/${order.id}/cancel`).send({}).expect(200))
      .body;
    expect(cancelled.status).toBe('CANCELLED');
    expect(await stockOf(product.id)).toBe(5);

    const again = await agent.post(`/api/orders/${order.id}/cancel`).send({}).expect(409);
    expect(again.body.code).toBe('ORDER_NOT_CANCELLABLE');
    expect(await stockOf(product.id)).toBe(5);
    const returns = await ctx.prisma.stockMovement.findMany({
      where: { referenceId: order.id, type: 'RETURN' },
    });
    expect(returns).toHaveLength(1);
  });

  it('applies only allowed admin status transitions and records history, audit and notifications', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const product = await createProduct(ctx.prisma, { stockQuantity: 5 });
    const { user, agent } = await customerWithCart([{ productId: product.id, quantity: 1 }]);
    const order = (await agent.post('/api/orders').send(orderBody(pickup.id)).expect(201)).body;

    const admin = await createUser(ctx.prisma, UserRole.ADMIN);
    const adminAgent = await loginAs(ctx.app, admin.email);
    const path = `/api/admin/orders/${order.id}/status`;

    const invalid = await adminAgent.patch(path).send({ status: 'COMPLETED' }).expect(409);
    expect(invalid.body).toMatchObject({
      code: 'INVALID_STATUS_TRANSITION',
      allowed: ['CONFIRMED', 'CANCELLED'],
    });

    for (const status of ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED']) {
      await adminAgent
        .patch(path)
        .send({ status, comment: `to ${status}` })
        .expect(200);
    }
    const detail = (await adminAgent.get(`/api/admin/orders/${order.id}`).expect(200)).body;
    expect(detail.status).toBe('COMPLETED');
    expect(detail.allowedTransitions).toEqual([]);
    expect(detail.statusHistory.map((h: { newStatus: string }) => h.newStatus)).toEqual([
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'COMPLETED',
    ]);
    expect(detail.statusHistory[1].changedBy.id).toBe(admin.id);
    expect(detail.confirmedAt).not.toBeNull();
    expect(detail.completedAt).not.toBeNull();

    await adminAgent.patch(path).send({ status: 'CANCELLED' }).expect(409);
    expect(await stockOf(product.id)).toBe(4); // completed order keeps its deduction

    const types = (
      await ctx.prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      })
    ).map((n) => n.type);
    expect(types).toEqual([
      'ORDER_CREATED',
      'ORDER_CONFIRMED',
      'GENERAL',
      'ORDER_READY',
      'ORDER_COMPLETED',
    ]);
    expect(
      await ctx.prisma.auditLog.count({
        where: { entityId: order.id, action: 'order.status_change' },
      })
    ).toBe(4);

    // Customers cannot cancel after confirmation.
    expect(
      (await agent.post(`/api/orders/${order.id}/cancel`).send({}).expect(409)).body.code
    ).toBe('ORDER_NOT_CANCELLABLE');
  });

  it('admin cancellation returns stock', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const product = await createProduct(ctx.prisma, { stockQuantity: 3 });
    const { agent } = await customerWithCart([{ productId: product.id, quantity: 3 }]);
    const order = (await agent.post('/api/orders').send(orderBody(pickup.id)).expect(201)).body;
    const adminAgent = await loginAs(ctx.app, (await createUser(ctx.prisma, UserRole.ADMIN)).email);

    await adminAgent
      .patch(`/api/admin/orders/${order.id}/status`)
      .send({ status: 'CONFIRMED' })
      .expect(200);
    await adminAgent
      .patch(`/api/admin/orders/${order.id}/status`)
      .send({ status: 'CANCELLED' })
      .expect(200);
    expect(await stockOf(product.id)).toBe(3);
  });

  it('hides other customers’ orders', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const product = await createProduct(ctx.prisma);
    const owner = await customerWithCart([{ productId: product.id, quantity: 1 }]);
    const order = (await owner.agent.post('/api/orders').send(orderBody(pickup.id)).expect(201))
      .body;

    const stranger = await loginAs(ctx.app, (await createUser(ctx.prisma)).email);
    await stranger.get(`/api/orders/${order.id}`).expect(404);
    await stranger.post(`/api/orders/${order.id}/cancel`).send({}).expect(404);
    expect((await stranger.get('/api/orders').expect(200)).body.meta.total).toBe(0);
    expect((await owner.agent.get('/api/orders').expect(200)).body.meta.total).toBe(1);
  });

  it('repeats an order into the cart, skipping products that are no longer sold', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const keep = await createProduct(ctx.prisma);
    const gone = await createProduct(ctx.prisma);
    const { agent } = await customerWithCart([
      { productId: keep.id, quantity: 2 },
      { productId: gone.id, quantity: 1 },
    ]);
    const order = (await agent.post('/api/orders').send(orderBody(pickup.id)).expect(201)).body;
    await ctx.prisma.product.update({ where: { id: gone.id }, data: { deletedAt: new Date() } });

    const res = (await agent.post(`/api/orders/${order.id}/repeat`).expect(200)).body;
    expect(res.cart.items).toEqual([expect.objectContaining({ productId: keep.id, quantity: 2 })]);
    expect(res.skipped).toEqual([{ productId: gone.id, reason: 'UNAVAILABLE' }]);
  });

  it('merges a guest cart after login, capping by stock', async () => {
    const limited = await createProduct(ctx.prisma, { stockQuantity: 3 });
    const free = await createProduct(ctx.prisma, { trackInventory: false });
    const { agent } = await customerWithCart([{ productId: limited.id, quantity: 2 }]);

    const res = (
      await agent
        .post('/api/cart/merge')
        .send({
          items: [
            { productId: limited.id, quantity: 5 },
            { productId: free.id, quantity: 1 },
            { productId: '00000000-0000-4000-8000-000000000000', quantity: 1 },
          ],
        })
        .expect(201)
    ).body;
    const quantities = Object.fromEntries(
      res.cart.items.map((i: { productId: string; quantity: number }) => [i.productId, i.quantity])
    );
    expect(quantities).toEqual({ [limited.id]: 3, [free.id]: 1 });
    expect(res.skipped).toHaveLength(1);
  });

  it('allows a review only for a completed purchase, once, and shows it after moderation', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const product = await createProduct(ctx.prisma);
    const { agent } = await customerWithCart([{ productId: product.id, quantity: 1 }]);
    const order = (await agent.post('/api/orders').send(orderBody(pickup.id)).expect(201)).body;
    const orderItemId = order.items[0].id;

    const early = await agent.post('/api/reviews').send({ orderItemId, rating: 5 }).expect(409);
    expect(early.body.code).toBe('ORDER_NOT_COMPLETED');

    await ctx.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.COMPLETED },
    });
    await agent.post('/api/reviews').send({ orderItemId, rating: 6 }).expect(422);
    const review = (
      await agent
        .post('/api/reviews')
        .send({ orderItemId, rating: 4, comment: 'Вкусно' })
        .expect(201)
    ).body;
    expect(
      (await agent.post('/api/reviews').send({ orderItemId, rating: 5 }).expect(409)).body.code
    ).toBe('ALREADY_REVIEWED');

    const stranger = await loginAs(ctx.app, (await createUser(ctx.prisma)).email);
    await stranger.post('/api/reviews').send({ orderItemId, rating: 1 }).expect(404);

    const publicList = async () =>
      (await agent.get(`/api/products/${product.slug}/reviews`).expect(200)).body;
    expect((await publicList()).meta.total).toBe(0);

    const adminAgent = await loginAs(ctx.app, (await createUser(ctx.prisma, UserRole.ADMIN)).email);
    await adminAgent
      .patch(`/api/admin/reviews/${review.id}`)
      .send({ status: 'APPROVED' })
      .expect(200);
    expect((await publicList()).data).toEqual([
      expect.objectContaining({ rating: 4, comment: 'Вкусно', author: 'Test U.' }),
    ]);
    expect((await agent.get(`/api/products/${product.slug}`).expect(200)).body.rating).toEqual({
      average: 4,
      count: 1,
    });
  });

  it('manages notifications of the current user only', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const product = await createProduct(ctx.prisma);
    const { agent } = await customerWithCart([{ productId: product.id, quantity: 1 }]);
    await agent.post('/api/orders').send(orderBody(pickup.id)).expect(201);

    const list = (await agent.get('/api/notifications').expect(200)).body;
    expect(list.unreadCount).toBe(1);
    const id = list.data[0].id;

    const stranger = await loginAs(ctx.app, (await createUser(ctx.prisma)).email);
    await stranger.patch(`/api/notifications/${id}/read`).expect(404);
    await stranger.delete(`/api/notifications/${id}`).expect(404);

    await agent.patch(`/api/notifications/${id}/read`).expect(204);
    expect((await agent.get('/api/notifications').expect(200)).body.unreadCount).toBe(0);
  });

  it('shows order statistics on the admin dashboard', async () => {
    const pickup = await createPickupLocation(ctx.prisma);
    const product = await createProduct(ctx.prisma, { name: 'Бал', priceAmount: 23500 });
    const { agent } = await customerWithCart([{ productId: product.id, quantity: 2 }]);
    const order = (await agent.post('/api/orders').send(orderBody(pickup.id)).expect(201)).body;
    await ctx.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
    });

    const adminAgent = await loginAs(ctx.app, (await createUser(ctx.prisma, UserRole.ADMIN)).email);
    const dashboard = (await adminAgent.get('/api/admin/dashboard?days=7').expect(200)).body;
    expect(dashboard.orders.total).toBe(1);
    expect(dashboard.revenue.total).toBe(47000);
    expect(dashboard.popularProducts[0]).toMatchObject({ name: 'Бал', quantity: 2 });
    expect(dashboard.salesByDay).toHaveLength(7);
    expect(dashboard.salesByDay[6]).toMatchObject({ orders: 1, revenue: 47000 });
  });
});
