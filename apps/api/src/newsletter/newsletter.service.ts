import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NewsletterStatus } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { AppError } from '../common/errors';
import { DEFAULT_LOCALE, Locale } from '../common/utils/locale';
import { paginate } from '../common/utils/pagination';
import { generateToken, hashToken } from '../common/utils/tokens';
import { MailService } from '../mail/mail.service';
import { newsletterConfirmMail } from '../mail/mail.templates';
import { PrismaService } from '../prisma/prisma.service';

import { AdminNewsletterQueryDto, SubscribeDto } from './dto/newsletter.dto';

/** A new confirmation e-mail is sent at most once per this interval. */
const RESEND_INTERVAL_MS = 10 * 60_000;
/** Confirmation links expire after 7 days. */
const CONFIRM_TTL_MS = 7 * 24 * 60 * 60_000;

/**
 * Newsletter with double opt-in (TZ §12). The response never says whether the
 * address was already subscribed. Without SMTP no e-mail is sent and the
 * subscriber stays PENDING (visible in the admin panel).
 */
@Injectable()
export class NewsletterService {
  private readonly webUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    config: ConfigService
  ) {
    this.webUrl = config.get<string>('WEB_URL') ?? 'http://localhost:3000';
  }

  async subscribe(dto: SubscribeDto): Promise<{ ok: true }> {
    const locale: Locale = dto.locale ?? DEFAULT_LOCALE;
    const now = new Date();
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: dto.email },
    });

    if (existing?.status === NewsletterStatus.ACTIVE) return { ok: true };
    if (
      existing?.status === NewsletterStatus.PENDING &&
      existing.confirmSentAt &&
      now.getTime() - existing.confirmSentAt.getTime() < RESEND_INTERVAL_MS
    ) {
      return { ok: true };
    }

    const token = generateToken();
    const data = {
      locale,
      status: NewsletterStatus.PENDING,
      consentAt: now,
      confirmTokenHash: hashToken(token),
      confirmSentAt: now,
      unsubscribedAt: null,
    };
    await this.prisma.newsletterSubscriber.upsert({
      where: { email: dto.email },
      create: { email: dto.email, ...data },
      update: data,
    });
    const link = `${this.webUrl}/${locale}/newsletter/confirm?token=${encodeURIComponent(token)}`;
    await this.mail.send(dto.email, newsletterConfirmMail(locale, link));
    return { ok: true };
  }

  async confirm(token: string): Promise<{ ok: true }> {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({
      where: { confirmTokenHash: hashToken(token) },
    });
    if (
      !subscriber ||
      subscriber.status !== NewsletterStatus.PENDING ||
      !subscriber.confirmSentAt ||
      Date.now() - subscriber.confirmSentAt.getTime() > CONFIRM_TTL_MS
    ) {
      throw AppError.badRequest('INVALID_TOKEN', 'The link is invalid or expired');
    }
    await this.prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { status: NewsletterStatus.ACTIVE, confirmedAt: new Date(), confirmTokenHash: null },
    });
    return { ok: true };
  }

  // --- Admin ---------------------------------------------------------------

  private static readonly ADMIN_SELECT = {
    id: true,
    email: true,
    locale: true,
    status: true,
    consentAt: true,
    confirmedAt: true,
    unsubscribedAt: true,
    createdAt: true,
  } as const;

  async adminList(query: AdminNewsletterQueryDto) {
    const where = query.status ? { status: query.status } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
        select: NewsletterService.ADMIN_SELECT,
      }),
      this.prisma.newsletterSubscriber.count({ where }),
    ]);
    return paginate(data, total, query.limit, query.offset);
  }

  /** Confirmed subscribers as CSV (e-mail, language, confirmation date). */
  async exportActiveCsv(): Promise<string> {
    const rows = await this.prisma.newsletterSubscriber.findMany({
      where: { status: NewsletterStatus.ACTIVE },
      orderBy: { confirmedAt: 'asc' },
      select: { email: true, locale: true, confirmedAt: true },
    });
    // A leading = + - @ would be run as a formula by spreadsheet apps.
    const cell = (value: string) => (/^[=+\-@]/.test(value) ? `'${value}` : value);
    const lines = rows.map(
      (r) => `${cell(r.email)},${r.locale},${r.confirmedAt?.toISOString() ?? ''}`
    );
    return ['email,locale,confirmed_at', ...lines].join('\n') + '\n';
  }

  /** Marks the subscriber as unsubscribed (e.g. on request); the record keeps the consent history. */
  async unsubscribe(adminId: string, id: string) {
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.newsletterSubscriber.updateMany({
        where: { id, status: { not: NewsletterStatus.UNSUBSCRIBED } },
        data: {
          status: NewsletterStatus.UNSUBSCRIBED,
          unsubscribedAt: new Date(),
          confirmTokenHash: null,
        },
      });
      if (updated.count === 0) {
        const exists = await tx.newsletterSubscriber.count({ where: { id } });
        if (!exists) throw AppError.notFound('SUBSCRIBER_NOT_FOUND', 'Subscriber not found');
        return;
      }
      await this.audit.log(tx, {
        userId: adminId,
        action: 'newsletter.unsubscribe',
        entityType: 'NewsletterSubscriber',
        entityId: id,
      });
    });
  }
}
