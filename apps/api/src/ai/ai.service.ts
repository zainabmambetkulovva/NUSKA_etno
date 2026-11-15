import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuditService } from '../audit/audit.service';
import { AppError } from '../common/errors';
import { DEFAULT_LOCALE, Locale } from '../common/utils/locale';
import { PrismaService } from '../prisma/prisma.service';

import type { AiReply } from './ai.types';
import { catalogAssistant } from './catalog-assistant';
import { AiChatDto } from './dto/ai.dto';
import type { AiProvider } from './providers/ai-provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { CatalogToolsService } from './tools/catalog-tools.service';

const SETTINGS_KEY = 'ai.settings';
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

/**
 * NUSKA AI (TZ section 07). With ANTHROPIC_API_KEY set and the assistant
 * enabled in the admin panel, a language model answers using catalog tools;
 * otherwise (or when the provider fails or the daily limit is reached) the
 * built-in catalog assistant answers. Both use only data from the database,
 * and neither changes the cart: proposals are added by the customer.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly provider: AiProvider | null;
  private readonly dailyLimit: number;
  private usage = { day: '', count: 0 };

  constructor(
    private readonly prisma: PrismaService,
    private readonly tools: CatalogToolsService,
    private readonly audit: AuditService,
    config: ConfigService
  ) {
    const key = config.get<string>('ANTHROPIC_API_KEY');
    const effort = config.get<string>('AI_EFFORT') ?? 'low';
    this.provider = key
      ? new AnthropicProvider(
          key,
          config.get<string>('AI_MODEL') || 'claude-opus-5-5',
          (EFFORTS as readonly string[]).includes(effort) ? (effort as 'low') : 'low'
        )
      : null;
    this.dailyLimit = Number(config.get('AI_DAILY_LIMIT') ?? 300) || 300;
  }

  async settings() {
    const row = await this.prisma.siteContent.findUnique({ where: { key: SETTINGS_KEY } });
    const data = (row?.data ?? {}) as { enabled?: boolean };
    return { enabled: data.enabled !== false };
  }

  async status() {
    const { enabled } = await this.settings();
    return { enabled, mode: this.provider ? 'ai' : 'catalog' } as const;
  }

  async adminSettings() {
    return {
      ...(await this.settings()),
      providerConfigured: Boolean(this.provider),
      provider: this.provider?.name ?? null,
      model: this.provider?.model ?? null,
      dailyLimit: this.dailyLimit,
      usedToday: this.usage.day === today() ? this.usage.count : 0,
    };
  }

  async updateSettings(adminId: string, enabled: boolean) {
    await this.prisma.$transaction(async (tx) => {
      await tx.siteContent.upsert({
        where: { key: SETTINGS_KEY },
        create: { key: SETTINGS_KEY, data: { enabled }, isActive: false },
        update: { data: { enabled } },
      });
      await this.audit.log(tx, {
        userId: adminId,
        action: 'ai.settings',
        entityType: 'SiteContent',
        entityId: SETTINGS_KEY,
        metadata: { enabled },
      });
    });
    return this.adminSettings();
  }

  async chat(dto: AiChatDto): Promise<AiReply> {
    if (!(await this.settings()).enabled)
      throw AppError.forbidden('AI_DISABLED', 'The assistant is turned off');
    const locale: Locale = dto.locale ?? DEFAULT_LOCALE;
    const messages = dto.messages;
    const last = messages[messages.length - 1];
    if (last.role !== 'user')
      throw AppError.badRequest('INVALID_CONVERSATION', 'The last message must be from the user');

    if (this.provider && this.takeQuota()) {
      try {
        const reply = await this.provider.chat(
          { messages, locale, cartSummary: await this.cartSummary(dto, locale) },
          this.tools
        );
        if (reply.reply || reply.proposal) return reply;
      } catch (error) {
        this.logger.error(`AI provider failed: ${(error as Error).message}`);
      }
    }
    return catalogAssistant(last.content, locale, this.tools);
  }

  private async cartSummary(dto: AiChatDto, locale: Locale) {
    if (!dto.cart?.length) return null;
    const quote = await this.tools.quote(dto.cart, locale);
    if (quote.items.length === 0) return null;
    return (
      quote.items.map((l) => `${l.product.name} × ${l.quantity}`).join(', ') +
      `; total ${quote.total.amount / 100} som`
    );
  }

  /** Simple in-memory cap on paid model calls per day (per API instance). */
  private takeQuota() {
    const day = today();
    if (this.usage.day !== day) this.usage = { day, count: 0 };
    if (this.usage.count >= this.dailyLimit) return false;
    this.usage.count++;
    return true;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
