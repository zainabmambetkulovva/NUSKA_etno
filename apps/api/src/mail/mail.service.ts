import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

import { MailContent } from './mail.templates';

const RESEND_URL = 'https://api.resend.com/emails';

/**
 * Sends transactional e-mail (password reset, e-mail verification, newsletter
 * confirmation). Delivery, in order of preference:
 * 1. Resend over HTTPS when RESEND_API_KEY is set — works on hosts that block
 *    outgoing SMTP ports (Render free plan);
 * 2. SMTP when SMTP_HOST is set;
 * 3. otherwise, outside production, the message is written to the log.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private resendKey: string | null = null;
  private from = 'NUSKA_etno <no-reply@localhost>';

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.from = this.config.get<string>('MAIL_FROM') || this.from;
    this.resendKey = this.config.get<string>('RESEND_API_KEY') || null;
    if (this.resendKey) return;

    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      const level = this.config.get<string>('NODE_ENV') === 'production' ? 'error' : 'warn';
      this.logger[level](
        'Neither RESEND_API_KEY nor SMTP_HOST is set: e-mails will not be delivered'
      );
      return;
    }
    this.transporter = createTransport({
      host,
      port: Number(this.config.get('SMTP_PORT') || 587),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: this.config.get<string>('SMTP_USER')
        ? {
            user: this.config.get<string>('SMTP_USER'),
            pass: this.config.get<string>('SMTP_PASSWORD'),
          }
        : undefined,
    });
  }

  /** Returns true when the message was handed to the provider. Never throws. */
  async send(to: string, content: MailContent): Promise<boolean> {
    if (this.resendKey) return this.sendWithResend(to, content);
    if (!this.transporter) {
      if (this.config.get<string>('NODE_ENV') !== 'production') {
        this.logger.log(`[dev mail] to=${to} subject="${content.subject}"\n${content.text}`);
      }
      return false;
    }
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: content.subject,
        text: content.text,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send e-mail to ${to}: ${(error as Error).message}`);
      return false;
    }
  }

  private async sendWithResend(to: string, content: MailContent): Promise<boolean> {
    try {
      const response = await fetch(RESEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [to],
          subject: content.subject,
          text: content.text,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        // the body explains the problem (unverified domain, bad key…); it never contains the key
        const detail = (await response.text()).slice(0, 300);
        this.logger.error(`Resend refused the e-mail (${response.status}): ${detail}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to reach Resend: ${(error as Error).message}`);
      return false;
    }
  }
}
