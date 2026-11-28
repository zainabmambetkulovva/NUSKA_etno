import { ConfigService } from '@nestjs/config';

import {
  cancelledMessage,
  escapeHtml,
  formatSom,
  newOrderMessage,
  OrderForMessage,
  paidMessage,
  prettyPhone,
} from './telegram.messages';
import { TelegramService } from './telegram.service';

const order: OrderForMessage = {
  id: 'o1',
  orderNumber: 48,
  customerName: 'Айгерим <b>',
  customerPhone: '+996555123456',
  customerEmail: null,
  deliveryMethod: 'DELIVERY',
  deliveryCity: 'Бишкек',
  deliveryAddress: 'Орозбеков көч., 136 & 5-батир',
  deliveryTime: 'эртең 18:00дөн кийин',
  pickupLocationName: null,
  paymentMethod: 'CASH',
  customerComment: null,
  totalAmount: 123400,
  items: [
    { productName: 'Нават 0.5', quantity: 2, totalPriceAmount: 20000 },
    { productName: 'Бал', quantity: 1, totalPriceAmount: 103400 },
  ],
};

describe('telegram messages', () => {
  it('formats money, phones and escapes HTML', () => {
    expect(formatSom(123400)).toBe('1 234 сом');
    expect(formatSom(12345)).toBe('123,45 сом');
    expect(prettyPhone('+996555123456')).toBe('+996 555 123 456');
    expect(escapeHtml('<a & "b">')).toBe('&lt;a &amp; &quot;b&quot;&gt;');
  });

  it('a new order lists the customer, the address, the items and a link to the admin', () => {
    const text = newOrderMessage(order, 'https://shop.kg/ky/admin/orders/o1');
    expect(text).toContain('Жаңы буйрутма №00048');
    expect(text).toContain('Айгерим &lt;b&gt;');
    expect(text).toContain('+996 555 123 456');
    expect(text).toContain('https://wa.me/996555123456');
    expect(text).toContain('Бишкек, Орозбеков көч., 136 &amp; 5-батир');
    expect(text).toContain('эртең 18:00дөн кийин');
    expect(text).toContain('• Нават 0.5 × 2 — 200 сом');
    expect(text).toContain('Жалпы: 1 234 сом');
    expect(text).toContain('алганда');
    expect(text).toContain('href="https://shop.kg/ky/admin/orders/o1"');
    expect(text).not.toContain('<b>Айгерим');
  });

  it('online payment and pickup are shown as such', () => {
    const text = newOrderMessage(
      { ...order, paymentMethod: 'ONLINE', deliveryMethod: 'PICKUP', pickupLocationName: 'Дүкөн' },
      'u'
    );
    expect(text).toContain('онлайн (Finik)');
    expect(text).toContain('Өзү алып кетүү: Дүкөн');
    expect(text).not.toContain('жеткирүүсүз');
    expect(paidMessage(order, 100, 'u')).toContain('№00048 төлөндү');
    expect(cancelledMessage(order, 'u')).toContain('№00048 жокко чыгарылды');
  });
});

describe('TelegramService', () => {
  const config = (env: Record<string, string>) =>
    ({ get: (key: string) => env[key] }) as unknown as ConfigService;
  const prisma = {
    siteContent: {
      findUnique: jest.fn().mockResolvedValue({ data: { chats: [{ id: '42', title: 'Shop' }] } }),
    },
    order: { findUnique: jest.fn().mockResolvedValue({ ...order, items: order.items }) },
  };
  const audit = { log: jest.fn() };
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('sends nothing without a bot token', async () => {
    const service = new TelegramService(config({}), prisma as never, audit as never);
    service.notifyNewOrder('o1');
    await new Promise((r) => setTimeout(r, 10));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(service.configured).toBe(false);
  });

  it('sends a new order to the saved chat and to TELEGRAM_CHAT_ID, and never throws', async () => {
    fetchMock.mockResolvedValue({ status: 200, json: async () => ({ ok: true, result: {} }) });
    const service = new TelegramService(
      config({
        TELEGRAM_BOT_TOKEN: 'secret-token',
        TELEGRAM_CHAT_ID: '-100500',
        WEB_URL: 'https://shop.kg/x',
      }),
      prisma as never,
      audit as never
    );
    service.notifyNewOrder('o1');
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.telegram.org/botsecret-token/sendMessage');
    const body = JSON.parse(init.body);
    expect(body.chat_id).toBe('-100500');
    expect(body.parse_mode).toBe('HTML');
    expect(body.text).toContain('https://shop.kg/ky/admin/orders/o1');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).chat_id).toBe('42');

    // a failing Telegram does not break anything
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    expect(() => service.notifyNewOrder('o1')).not.toThrow();
    await new Promise((r) => setTimeout(r, 20));
  });

  it('finds the chats that wrote to the bot', async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      json: async () => ({
        ok: true,
        result: [
          { message: { chat: { id: 7, type: 'private', first_name: 'Зайнаб' } } },
          { my_chat_member: { chat: { id: -100, type: 'group', title: 'NUSKA заказы' } } },
          { message: { chat: { id: 7, type: 'private', first_name: 'Зайнаб' } } },
        ],
      }),
    });
    const service = new TelegramService(
      config({ TELEGRAM_BOT_TOKEN: 't' }),
      prisma as never,
      audit as never
    );
    await expect(service.discover()).resolves.toEqual([
      { id: '7', title: 'Зайнаб' },
      { id: '-100', title: 'NUSKA заказы' },
    ]);
  });
});
