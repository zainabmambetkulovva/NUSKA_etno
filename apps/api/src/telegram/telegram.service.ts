import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { AppError } from '../common/errors';
import { webOrigin } from '../common/utils/web-origin';
import { PrismaService } from '../prisma/prisma.service';

import {
  cancelledMessage,
  CONNECTED_MESSAGE,
  newOrderMessage,
  OrderForMessage,
  paidMessage,
  TEST_MESSAGE,
} from './telegram.messages';

/** Saved chats live in a hidden content block (not public: isActive = false). */
const SETTINGS_KEY = 'telegram.settings';

export interface TelegramChat {
  id: string;
  title: string;
}

interface TelegramUpdate {
  message?: { chat: RawChat };
  edited_message?: { chat: RawChat };
  channel_post?: { chat: RawChat };
  my_chat_member?: { chat: RawChat };
}
interface RawChat {
  id: number;
  type: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

const chatTitle = (c: RawChat) =>
  c.title ??
  ([c.first_name, c.last_name].filter(Boolean).join(' ') ||
    (c.username ? `@${c.username}` : String(c.id)));

/**
 * Tells the shop about orders in Telegram: a new order, an online payment, a
 * cancellation by the customer. The bot token comes from TELEGRAM_BOT_TOKEN
 * (a secret, set on the server); the chats are connected in the admin panel
 * (or listed in TELEGRAM_CHAT_ID). Without a token nothing is sent. Sending
 * never blocks or breaks an order: errors are only logged (without the token).
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token: string | null;
  private readonly envChats: string[];
  private readonly webUrl: string;
  /** Bot API address; only tests point it elsewhere. */
  private readonly apiBase: string;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {
    this.token = config.get<string>('TELEGRAM_BOT_TOKEN')?.trim() || null;
    this.envChats = (config.get<string>('TELEGRAM_CHAT_ID') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    this.webUrl = webOrigin(config);
    this.apiBase = (config.get<string>('TELEGRAM_API_URL') || 'https://api.telegram.org').replace(
      /\/$/,
      ''
    );
  }

  get configured() {
    return Boolean(this.token);
  }

  private orderUrl(orderId: string) {
    return `${this.webUrl}/ky/admin/orders/${orderId}`;
  }

  /** Calls the Bot API; throws an Error with Telegram's own description. */
  private async call<T>(method: string, body?: Record<string, unknown>): Promise<T> {
    if (!this.token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
    let response: Response;
    try {
      response = await fetch(`${this.apiBase}/bot${this.token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
        signal: AbortSignal.timeout(8000),
      });
    } catch (error) {
      // the message of a network error never contains the URL (and so not the token)
      throw new Error(`Telegram is not reachable: ${(error as Error).name}`);
    }
    const json = (await response.json().catch(() => null)) as {
      ok?: boolean;
      result?: T;
      description?: string;
    } | null;
    if (!json?.ok) throw new Error(json?.description ?? `HTTP ${response.status}`);
    return json.result as T;
  }

  async savedChats(): Promise<TelegramChat[]> {
    const row = await this.prisma.siteContent.findUnique({ where: { key: SETTINGS_KEY } });
    const chats = (row?.data as { chats?: TelegramChat[] } | null)?.chats;
    return Array.isArray(chats) ? chats.filter((c) => c && typeof c.id === 'string') : [];
  }

  private async chatIds(): Promise<string[]> {
    const saved = await this.savedChats();
    return [...new Set([...this.envChats, ...saved.map((c) => c.id)])];
  }

  /** Sends to every chat; returns how many received it. Never throws. */
  private async broadcast(text: string): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;
    for (const chatId of await this.chatIds()) {
      try {
        await this.call('sendMessage', {
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });
        sent++;
      } catch (error) {
        failed++;
        this.logger.warn(`Telegram message to chat ${chatId} failed: ${(error as Error).message}`);
      }
    }
    return { sent, failed };
  }

  /** Runs a notification in the background: the caller never waits or fails because of it. */
  private fire(task: () => Promise<unknown>) {
    if (!this.token) return;
    void task().catch((error: Error) =>
      this.logger.warn(`Telegram notification failed: ${error.message}`)
    );
  }

  private loadOrder(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
  }

  notifyNewOrder(orderId: string) {
    this.fire(async () => {
      const order = await this.loadOrder(orderId);
      if (order)
        await this.broadcast(
          newOrderMessage(order as unknown as OrderForMessage, this.orderUrl(order.id))
        );
    });
  }

  notifyOrderPaid(paymentId: string) {
    this.fire(async () => {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });
      if (payment)
        await this.broadcast(
          paidMessage(payment.order, payment.amount, this.orderUrl(payment.orderId))
        );
    });
  }

  notifyOrderCancelled(orderId: string) {
    this.fire(async () => {
      const order = await this.loadOrder(orderId);
      if (order) await this.broadcast(cancelledMessage(order, this.orderUrl(order.id)));
    });
  }

  // ---------------------------------------------------------------- admin

  async status() {
    const chats = await this.savedChats();
    if (!this.token)
      return { tokenConfigured: false, bot: null, chats, envChats: this.envChats.length };
    try {
      const me = await this.call<{ username: string; first_name: string }>('getMe');
      return {
        tokenConfigured: true,
        bot: { username: me.username, name: me.first_name },
        chats,
        envChats: this.envChats.length,
      };
    } catch (error) {
      return {
        tokenConfigured: true,
        bot: null,
        chats,
        envChats: this.envChats.length,
        error: (error as Error).message,
      };
    }
  }

  /** Chats that wrote to the bot (or added it) during the last 24 hours. */
  async discover(): Promise<TelegramChat[]> {
    this.requireToken();
    let updates: TelegramUpdate[];
    try {
      updates = await this.call<TelegramUpdate[]>('getUpdates', {
        allowed_updates: ['message', 'channel_post', 'my_chat_member'],
      });
    } catch (error) {
      throw AppError.badRequest('TELEGRAM_ERROR', (error as Error).message);
    }
    const found = new Map<string, TelegramChat>();
    for (const u of updates) {
      const chat =
        u.message?.chat ?? u.edited_message?.chat ?? u.channel_post?.chat ?? u.my_chat_member?.chat;
      if (chat) found.set(String(chat.id), { id: String(chat.id), title: chatTitle(chat) });
    }
    return [...found.values()];
  }

  async connect(adminId: string, chat: TelegramChat) {
    this.requireToken();
    try {
      await this.call('sendMessage', {
        chat_id: chat.id,
        text: CONNECTED_MESSAGE,
        parse_mode: 'HTML',
      });
    } catch (error) {
      throw AppError.badRequest('TELEGRAM_SEND_FAILED', (error as Error).message);
    }
    const chats = (await this.savedChats()).filter((c) => c.id !== chat.id);
    await this.save(adminId, [...chats, { id: chat.id, title: chat.title.slice(0, 128) }]);
    return this.status();
  }

  async disconnect(adminId: string, chatId: string) {
    const chats = (await this.savedChats()).filter((c) => c.id !== chatId);
    await this.save(adminId, chats);
    return this.status();
  }

  async sendTest() {
    this.requireToken();
    const result = await this.broadcast(TEST_MESSAGE);
    if (result.sent === 0)
      throw AppError.badRequest('TELEGRAM_NO_CHATS', 'No connected chat received the message');
    return result;
  }

  private requireToken() {
    if (!this.token)
      throw AppError.conflict('TELEGRAM_NOT_CONFIGURED', 'TELEGRAM_BOT_TOKEN is not set');
  }

  private async save(adminId: string, chats: TelegramChat[]) {
    const data = { chats } as unknown as Prisma.InputJsonValue;
    await this.prisma.$transaction(async (tx) => {
      await tx.siteContent.upsert({
        where: { key: SETTINGS_KEY },
        create: { key: SETTINGS_KEY, data, isActive: false },
        update: { data },
      });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'telegram.chats',
        entityType: 'SiteContent',
        entityId: SETTINGS_KEY,
        metadata: { chats: chats.map((c) => c.id) },
      });
    });
  }
}
