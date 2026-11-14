import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

import { MailContent } from './mail.templates';

/**
 * Sends transactional e-mail over SMTP (configured via SMTP_* env vars).
 * Without SMTP_HOST, outside production, messages are written to the log so
 * the flows can be used during development.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private from = 'NUSKA_etno <no-reply@localhost>';

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    this.from = this.config.get<string>('MAIL_FROM') || this.from;
    if (!host) {
      const level = this.config.get<string>('NODE_ENV') === 'production' ? 'error' : 'warn';
      this.logger[level]('SMTP_HOST is not set: e-mails will not be delivered');
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

  /** Returns true when the message was handed to the SMTP server. Never throws. */
  async send(to: string, content: MailContent): Promise<boolean> {
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
}
