import { UserRole } from '@prisma/client';
import request from 'supertest';

import { signFinik } from '../src/payments/finik/finik-signature';
import {
  FINIK_TEST_PRIVATE_KEY,
  FINIK_TEST_PUBLIC_KEY,
} from '../src/payments/finik/finik.fixtures';

import {
  createProduct,
  createTestApp,
  createUser,
  loginAs,
  resetDatabase,
  TestContext,
} from './utils';

const ACCOUNT = 'nuska-account';
const WEBHOOK_PATH = '/api/payments/finik/webhook';

describe('Online payment with Finik (e2e)', () => {
  let ctx: TestContext;
  let fetchSpy: jest.SpyInstance;
  let finikRequests: { url: string; body: Record<string, unknown>; headers: Headers }[];

  beforeAll(async () => {
    Object.assign(process.env, {
      FINIK_API_KEY: 'test-api-key',
      FINIK_ACCOUNT_ID: ACCOUNT,
      FINIK_PRIVATE_KEY: FINIK_TEST_PRIVATE_KEY,
      // webhooks in this test are signed with Finik's published TEST key pair
      FINIK_PUBLIC_KEY: FINIK_TEST_PUBLIC_KEY,
      FINIK_ENV: 'beta',
      // real amounts in this suite (test mode is on by default)
      FINIK_TEST_AMOUNT: '0',
    });
    ctx = await createTestApp();
  });
  afterAll(async () => {
    for (const key of [
      'FINIK_API_KEY',
      'FINIK_ACCOUNT_ID',
      'FINIK_PRIVATE_KEY',
      'FINIK_PUBLIC_KEY',
      'FINIK_ENV',
      'FINIK_TEST_AMOUNT',
    ])
      delete process.env[key];
    await ctx.app.close();
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    finikRequests = [];
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url !== 'https://beta.api.acquiring.averspay.kg/v1/payment')
        throw new Error(`unexpected ${url}`);
      finikRequests.push({
        url,
        body: JSON.parse(String(init?.body)),
        headers: new Headers(init?.headers as Record<string, string>),
      });
      return new Response(null, {
        status: 302,
        headers: { Location: 'https://pay.finik.kg/p/abc' },
      });
    });
  });
  afterEach(() => fetchSpy.mockRestore());

  const webhook = (body: Record<string, unknown>, privateKey = FINIK_TEST_PRIVATE_KEY) => {
    const timestamp = String(Date.now());
    const signature = signFinik(
      {
        method: 'POST',
        path: WEBHOOK_PATH,
        headers: { Host: 'localhost:3000', 'x-api-timestamp': timestamp },
        body,
      },
      privateKey
    );
    return request(ctx.app.getHttpServer())
      .post(WEBHOOK_PATH)
      .set('x-api-timestamp', timestamp)
      .set('signature', signature)
      .send(body);
  };

  it('pays an order online: signed request to Finik, payment page, signed webhook marks it paid once', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/payments/methods')
      .expect(200, { cash: true, online: true, testAmount: null });
    const product = await createProduct(ctx.prisma, { priceAmount: 15000, stockQuantity: 5 });
    const user = await createUser(ctx.prisma);
    const agent = await loginAs(ctx.app, user.email);
    await agent.post('/api/cart/items').send({ productId: product.id, quantity: 2 }).expect(201);

    const order = (
      await agent
        .post('/api/orders?locale=ru')
        .send({
          customerName: 'Айдай',
          customerPhone: '0555123456',
          deliveryMethod: 'DELIVERY',
          deliveryCity: 'Бишкек',
          deliveryAddress: 'Орозбекова 136',
          paymentMethod: 'ONLINE',
        })
        .expect(201)
    ).body;
    expect(order).toMatchObject({
      paymentMethod: 'ONLINE',
      paymentUrl: 'https://pay.finik.kg/p/abc',
    });
    expect(order.payments).toEqual([
      expect.objectContaining({ method: 'ONLINE', status: 'PENDING' }),
    ]);

    // what was sent to Finik: whole som, our payment id, webhook through the website
    const sent = finikRequests[0];
    expect(sent.headers.get('x-api-key')).toBe('test-api-key');
    expect(sent.headers.get('signature')).toBeTruthy();
    expect(sent.body).toMatchObject({
      Amount: 300,
      CardType: 'FINIK_QR',
      Lang: 'ru',
      RedirectUrl: `http://localhost:3000/ru/checkout/paid/${order.id}`,
      Data: { accountId: ACCOUNT, webhookUrl: `http://localhost:3000${WEBHOOK_PATH}` },
    });
    const paymentId = sent.body.PaymentId as string;
    const event = {
      id: `1_${paymentId}_DEBIT`,
      status: 'SUCCEEDED',
      amount: 300,
      transactionId: paymentId,
      fields: { paymentId, amount: 300 },
      data: { accountId: ACCOUNT, description: 'x' },
    };

    // not signed by Finik, or paid to another account: nothing changes
    await webhook(
      event,
      (await import('node:crypto'))
        .generateKeyPairSync('rsa', { modulusLength: 2048 })
        .privateKey.export({ type: 'pkcs1', format: 'pem' })
        .toString()
    ).expect(401);
    await webhook({ ...event, data: { accountId: 'someone-else' } }).expect(401);
    expect((await agent.get(`/api/orders/${order.id}`).expect(200)).body.payments[0].status).toBe(
      'PENDING'
    );

    await webhook(event).expect(200, { ok: true });
    await webhook(event).expect(200, { ok: true }); // Finik resends: applied once
    const paid = (await agent.get(`/api/orders/${order.id}`).expect(200)).body;
    expect(paid.payments).toEqual([expect.objectContaining({ status: 'PAID' })]);
    expect(await ctx.prisma.paymentEvent.count()).toBe(1);

    // a paid order cannot be paid again
    await agent.post(`/api/orders/${order.id}/pay?locale=ru`).expect(409);
  });

  it('ignores an underpaying webhook and lets the customer pay again', async () => {
    const product = await createProduct(ctx.prisma, { priceAmount: 20000, stockQuantity: 5 });
    const user = await createUser(ctx.prisma, UserRole.USER);
    const agent = await loginAs(ctx.app, user.email);
    await agent.post('/api/cart/items').send({ productId: product.id, quantity: 1 }).expect(201);
    const order = (
      await agent
        .post('/api/orders')
        .send({
          customerName: 'Айдай',
          customerPhone: '0555123456',
          deliveryMethod: 'DELIVERY',
          deliveryCity: 'Бишкек',
          deliveryAddress: 'Орозбекова 136',
          paymentMethod: 'ONLINE',
        })
        .expect(201)
    ).body;
    const paymentId = finikRequests[0].body.PaymentId as string;
    await webhook({
      id: 'e1',
      status: 'SUCCEEDED',
      amount: 1,
      fields: { paymentId },
      data: { accountId: ACCOUNT },
    }).expect(200);
    expect((await agent.get(`/api/orders/${order.id}`).expect(200)).body.payments[0].status).toBe(
      'PENDING'
    );

    const again = await agent.post(`/api/orders/${order.id}/pay`).expect(200);
    expect(again.body).toEqual({ paymentUrl: 'https://pay.finik.kg/p/abc' });
  });
});

describe('Finik test mode: FINIK_TEST_AMOUNT (e2e)', () => {
  let ctx: TestContext;
  let fetchSpy: jest.SpyInstance;
  let sent: Record<string, unknown>[];

  beforeAll(async () => {
    Object.assign(process.env, {
      FINIK_API_KEY: 'test-api-key',
      FINIK_ACCOUNT_ID: ACCOUNT,
      FINIK_PRIVATE_KEY: FINIK_TEST_PRIVATE_KEY,
      FINIK_PUBLIC_KEY: FINIK_TEST_PUBLIC_KEY,
      FINIK_ENV: 'beta',
      // not set at all: test mode is on by default (1 som)
      FINIK_TEST_AMOUNT: '',
    });
    ctx = await createTestApp();
  });
  afterAll(async () => {
    for (const key of [
      'FINIK_API_KEY',
      'FINIK_ACCOUNT_ID',
      'FINIK_PRIVATE_KEY',
      'FINIK_PUBLIC_KEY',
      'FINIK_ENV',
      'FINIK_TEST_AMOUNT',
    ])
      delete process.env[key];
    await ctx.app.close();
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    sent = [];
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async (_input, init) => {
      sent.push(JSON.parse(String(init?.body)));
      return new Response(null, { status: 302, headers: { Location: 'https://pay.finik.kg/p/t' } });
    });
  });
  afterEach(() => fetchSpy.mockRestore());

  it('charges 1 som while prices and the order total stay real; the 1-som webhook pays it', async () => {
    await request(ctx.app.getHttpServer())
      .get('/api/payments/methods')
      .expect(200, { cash: true, online: true, testAmount: 1 });
    const product = await createProduct(ctx.prisma, { priceAmount: 23500, stockQuantity: 5 });
    const user = await createUser(ctx.prisma);
    const agent = await loginAs(ctx.app, user.email);
    await agent.post('/api/cart/items').send({ productId: product.id, quantity: 1 }).expect(201);
    const order = (
      await agent
        .post('/api/orders')
        .send({
          customerName: 'Айдай',
          customerPhone: '0555123456',
          deliveryMethod: 'DELIVERY',
          deliveryCity: 'Бишкек',
          deliveryAddress: 'Орозбекова 136',
          paymentMethod: 'ONLINE',
        })
        .expect(201)
    ).body;
    expect(order.total.amount).toBe(23500);
    expect(sent[0]).toMatchObject({ Amount: 1 });

    const paymentId = sent[0].PaymentId as string;
    const timestamp = String(Date.now());
    const body = {
      id: 'evt-1',
      status: 'SUCCEEDED',
      amount: 1,
      fields: { paymentId },
      data: { accountId: ACCOUNT },
    };
    const signature = signFinik(
      {
        method: 'POST',
        path: WEBHOOK_PATH,
        headers: { Host: 'localhost:3000', 'x-api-timestamp': timestamp },
        body,
      },
      FINIK_TEST_PRIVATE_KEY
    );
    await request(ctx.app.getHttpServer())
      .post(WEBHOOK_PATH)
      .set('x-api-timestamp', timestamp)
      .set('signature', signature)
      .send(body)
      .expect(200);
    const paid = (await agent.get(`/api/orders/${order.id}`).expect(200)).body;
    expect(paid.payments).toEqual([
      expect.objectContaining({ status: 'PAID', amount: expect.objectContaining({ amount: 100 }) }),
    ]);
  });
});
