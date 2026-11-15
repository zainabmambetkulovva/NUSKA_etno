import { UserRole } from '@prisma/client';
import request from 'supertest';

import { parseBudget } from '../src/ai/catalog-assistant';
import { AnthropicProvider } from '../src/ai/providers/anthropic.provider';
import { CatalogToolsService } from '../src/ai/tools/catalog-tools.service';

import {
  createPickupLocation,
  createProduct,
  createTestApp,
  createUser,
  loginAs,
  resetDatabase,
  TestContext,
} from './utils';

describe('NUSKA AI (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(async () => resetDatabase(ctx.prisma));
  afterAll(async () => ctx.app.close());

  const http = () => request(ctx.app.getHttpServer());
  const ask = (content: string, locale = 'ru') =>
    http()
      .post('/api/ai/chat')
      .send({ locale, messages: [{ role: 'user', content }] });

  const seedCatalog = async () => {
    const navat = await createProduct(ctx.prisma, { name: 'Нават', priceAmount: 10000 });
    await ctx.prisma.product.update({ where: { id: navat.id }, data: { sku: 'NAVAT-0.5' } });
    const bal = await createProduct(ctx.prisma, { name: 'Бал', priceAmount: 23500 });
    await ctx.prisma.product.update({ where: { id: bal.id }, data: { sku: 'BAL' } });
    const kymyz = await createProduct(ctx.prisma, { name: 'Кымыз', priceAmount: 30000 });
    await ctx.prisma.product.update({ where: { id: kymyz.id }, data: { sku: 'KYMYZ' } });
    return { navat, bal, kymyz };
  };

  it('parses budgets', () => {
    expect(parseBudget('подбери на 1 000 сом')).toBe(1000);
    expect(parseBudget('1500с')).toBe(1500);
    expect(parseBudget('2 штуки')).toBeNull();
  });

  describe('catalog mode (no AI provider configured)', () => {
    it('reports the mode honestly', async () => {
      const res = await http().get('/api/ai/status').expect(200);
      expect(res.body).toEqual({ enabled: true, mode: 'catalog' });
    });

    it('builds a set within the budget from real prices, without touching the cart', async () => {
      await seedCatalog();
      const res = await ask('Подбери продукты на 400 сом').expect(200);
      expect(res.body.mode).toBe('catalog');
      expect(res.body.proposal.total.amount).toBeLessThanOrEqual(40000);
      expect(
        res.body.proposal.items.map((l: { product: { name: string } }) => l.product.name)
      ).toEqual(['Нават', 'Бал']);
      expect(await ctx.prisma.cartItem.count()).toBe(0);
    });

    it('answers in Kyrgyz, lists the catalog and explains pickup', async () => {
      await seedCatalog();
      await createPickupLocation(ctx.prisma);
      const catalog = await ask('Кандай азыктар бар?', 'ky').expect(200);
      expect(catalog.body.reply).toContain('каталогдо');
      expect(catalog.body.products).toHaveLength(3);

      const pickup = await ask('Как забрать заказ?').expect(200);
      expect(pickup.body.reply).toContain('Пункты самовывоза');

      const found = await ask('Кымыз').expect(200);
      expect(found.body.products[0].name).toBe('Кымыз');

      const unknown = await ask('Расскажи анекдот').expect(200);
      expect(unknown.body.products).toEqual([]);
      expect(unknown.body.proposal).toBeNull();
    });

    it('validates the conversation', async () => {
      await http()
        .post('/api/ai/chat')
        .send({ messages: [{ role: 'assistant', content: 'Привет' }] })
        .expect(400);
      await http()
        .post('/api/ai/chat')
        .send({ messages: [{ role: 'user', content: 'x'.repeat(1001) }] })
        .expect(422);
      await http().post('/api/ai/chat').send({ messages: [] }).expect(422);
    });
  });

  it('admin can turn the assistant off and on (audited)', async () => {
    const admin = await createUser(ctx.prisma, UserRole.ADMIN);
    const agent = await loginAs(ctx.app, admin.email);
    const settings = await agent.get('/api/admin/ai/settings').expect(200);
    expect(settings.body).toMatchObject({ enabled: true, providerConfigured: false });

    await agent.put('/api/admin/ai/settings').send({ enabled: false }).expect(200);
    const off = await ask('Привет');
    expect(off.status).toBe(403);
    expect(off.body.code).toBe('AI_DISABLED');
    expect((await http().get('/api/ai/status').expect(200)).body.enabled).toBe(false);
    // Disabled settings are not exposed as public content.
    await http().get('/api/content/ai.settings').expect(404);

    await agent.put('/api/admin/ai/settings').send({ enabled: true }).expect(200);
    await ask('Привет').expect(200);
    expect(await ctx.prisma.auditLog.count({ where: { action: 'ai.settings' } })).toBe(2);

    const user = await createUser(ctx.prisma);
    const userAgent = await loginAs(ctx.app, user.email);
    await userAgent.put('/api/admin/ai/settings').send({ enabled: false }).expect(403);
  });

  it('Claude provider: runs catalog tools and returns a proposal only (mocked API)', async () => {
    const { navat, bal } = await seedCatalog();
    const tools = ctx.app.get(CatalogToolsService);
    const provider = new AnthropicProvider('test-key', 'claude-opus-5-5', 'low');
    const create = jest
      .fn()
      .mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 't1', name: 'search_products', input: { query: 'нават' } },
        ],
      })
      .mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          {
            type: 'tool_use',
            id: 't2',
            name: 'propose_cart',
            input: {
              items: [
                { product_id: navat.id, quantity: 2 },
                { product_id: bal.id, quantity: 1 },
              ],
            },
          },
          { type: 'tool_use', id: 't3', name: 'get_product', input: { product_id: 'not-a-uuid' } },
        ],
      })
      .mockResolvedValueOnce({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Вот набор для дасторкона.' }],
      });
    (provider as unknown as { client: { beta: { messages: { create: jest.Mock } } } }).client = {
      beta: { messages: { create } },
    };

    const reply = await provider.chat(
      {
        messages: [{ role: 'user', content: 'Собери дасторкон' }],
        locale: 'ru',
        cartSummary: null,
      },
      tools
    );
    expect(reply.mode).toBe('ai');
    expect(reply.reply).toBe('Вот набор для дасторкона.');
    expect(reply.proposal?.total.amount).toBe(2 * 10000 + 23500);
    expect(await ctx.prisma.cartItem.count()).toBe(0);

    // Request shape: cached system prompt, strict tools, language in the context line, fallbacks.
    const first = create.mock.calls[0][0];
    expect(first.model).toBe('claude-opus-5-5');
    expect(first.fallbacks).toBe('default');
    expect(first.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(first.tools.every((t: { strict: boolean }) => t.strict)).toBe(true);
    expect(first.messages[0].content[0].text).toContain('language=ru');
    // The search result went back to the model as data; the bad id came back as an error.
    // (The SDK mock keeps a reference to the same, now complete, history.)
    const history = create.mock.calls[2][0].messages;
    const results = history[history.length - 2].content;
    expect(results.find((r: { tool_use_id: string }) => r.tool_use_id === 't3').is_error).toBe(
      true
    );
  });
});
