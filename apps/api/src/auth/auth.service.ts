import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';

import { AppError } from '../common/errors';
import { parseDurationSeconds } from '../common/utils/duration';
import { DEFAULT_LOCALE, isLocale } from '../common/utils/locale';
import { normalizePhone } from '../common/utils/phone';
import { generateToken, hashToken } from '../common/utils/tokens';
import { MailService } from '../mail/mail.service';
import { emailVerificationMail, passwordResetMail } from '../mail/mail.templates';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from '../users/user.mapper';

import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';
import { PasswordService } from './password.service';

export interface ClientMeta {
  userAgent?: string;
  ipAddress?: string;
}

export interface IssuedTokens {
  accessToken: string;
  accessTokenMaxAgeMs: number;
  refreshToken: string;
  refreshTokenMaxAgeMs: number;
}

export interface JwtPayload {
  sub: string;
  sid: string;
}

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlMs: number;
  private readonly webUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly passwords: PasswordService,
    private readonly mail: MailService,
    config: ConfigService
  ) {
    this.accessTtlSeconds = parseDurationSeconds(config.get<string>('JWT_EXPIRES_IN') ?? '15m');
    this.refreshTtlMs = (config.get<number>('REFRESH_TOKEN_TTL_DAYS') ?? 30) * 24 * 60 * 60 * 1000;
    this.webUrl = config.get<string>('WEB_URL') ?? 'http://localhost:3000';
  }

  async register(dto: RegisterDto, meta: ClientMeta) {
    let phone: string | null = null;
    if (dto.phone) {
      phone = normalizePhone(dto.phone);
      if (!phone) throw AppError.badRequest('INVALID_PHONE', 'Phone number is not valid');
    }

    const passwordHash = await this.passwords.hash(dto.password);
    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName || null,
          phone,
          locale: dto.locale ?? DEFAULT_LOCALE,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw AppError.conflict('EMAIL_TAKEN', 'An account with this e-mail already exists');
      }
      throw error;
    }

    await this.sendEmailVerification(user);
    const tokens = await this.createSession(user.id, meta);
    return { user: toPublicUser(user), tokens };
  }

  async login(dto: LoginDto, meta: ClientMeta) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const passwordOk = await this.passwords.verify(dto.password, user?.passwordHash ?? null);

    if (!user || !passwordOk || user.deletedAt) {
      throw AppError.unauthorized('INVALID_CREDENTIALS', 'Invalid e-mail or password');
    }
    if (!user.isActive) {
      throw AppError.forbidden('ACCOUNT_DISABLED', 'This account is disabled');
    }

    await this.prisma.session.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
    });
    const tokens = await this.createSession(user.id, meta);
    return { user: toPublicUser(user), tokens };
  }

  /** Rotates the refresh token: the presented token becomes invalid immediately. */
  async refresh(refreshToken: string | undefined, meta: ClientMeta) {
    if (!refreshToken) throw AppError.unauthorized('SESSION_EXPIRED', 'Session expired');

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { user: true },
    });
    if (!session || session.expiresAt <= new Date()) {
      if (session)
        await this.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      throw AppError.unauthorized('SESSION_EXPIRED', 'Session expired');
    }
    if (!session.user.isActive || session.user.deletedAt) {
      await this.prisma.session.deleteMany({ where: { userId: session.userId } });
      throw AppError.unauthorized('SESSION_EXPIRED', 'Session expired');
    }

    const newRefreshToken = generateToken();
    // Conditional update: two concurrent refreshes with the same token cannot both succeed.
    const rotated = await this.prisma.session.updateMany({
      where: { id: session.id, tokenHash: session.tokenHash },
      data: {
        tokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
        userAgent: meta.userAgent?.slice(0, 500),
        ipAddress: meta.ipAddress,
      },
    });
    if (rotated.count !== 1) throw AppError.unauthorized('SESSION_EXPIRED', 'Session expired');

    return {
      user: toPublicUser(session.user),
      tokens: this.issueTokens(session.userId, session.id, newRefreshToken),
    };
  }

  /** User of a valid access token with a live session, or null. Never throws. */
  async userFromAccessToken(accessToken: string) {
    try {
      const payload = this.jwt.verify<JwtPayload>(accessToken, { algorithms: ['HS256'] });
      const session = await this.prisma.session.findUnique({
        where: { id: payload.sid },
        include: { user: true },
      });
      if (
        !session ||
        session.userId !== payload.sub ||
        session.expiresAt <= new Date() ||
        !session.user.isActive ||
        session.user.deletedAt
      ) {
        return null;
      }
      return toPublicUser(session.user);
    } catch {
      return null;
    }
  }

  /** Ends the session identified by the refresh token (works even if the access token expired). */
  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    await this.prisma.session.deleteMany({ where: { tokenHash: hashToken(refreshToken) } });
  }

  /** Always succeeds, so the endpoint does not reveal which e-mails are registered. */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.deletedAt || !user.isActive) return;

    const token = generateToken();
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      }),
    ]);

    const link = `${this.webUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.mail.send(
      user.email,
      passwordResetMail(isLocale(user.locale) ? user.locale : DEFAULT_LOCALE, link)
    );
  }

  /** Sets a new password and signs the user out everywhere. */
  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(dto.token) },
    });
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      throw AppError.badRequest('INVALID_TOKEN', 'The link is invalid or has expired');
    }

    const passwordHash = await this.passwords.hash(dto.password);
    await this.prisma.$transaction(async (tx) => {
      const marked = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (marked.count !== 1)
        throw AppError.badRequest('INVALID_TOKEN', 'The link is invalid or has expired');
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
      await tx.session.deleteMany({ where: { userId: record.userId } });
    });
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      throw AppError.badRequest('INVALID_TOKEN', 'The link is invalid or has expired');
    }
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);
  }

  async resendEmailVerification(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.emailVerifiedAt) {
      throw AppError.badRequest('EMAIL_ALREADY_VERIFIED', 'E-mail is already verified');
    }
    await this.sendEmailVerification(user);
  }

  private async sendEmailVerification(user: User) {
    const token = generateToken();
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      this.prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        },
      }),
    ]);
    const link = `${this.webUrl}/verify-email?token=${encodeURIComponent(token)}`;
    await this.mail.send(
      user.email,
      emailVerificationMail(isLocale(user.locale) ? user.locale : DEFAULT_LOCALE, link)
    );
  }

  private async createSession(userId: string, meta: ClientMeta): Promise<IssuedTokens> {
    const refreshToken = generateToken();
    const session = await this.prisma.session.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
        userAgent: meta.userAgent?.slice(0, 500),
        ipAddress: meta.ipAddress,
      },
    });
    return this.issueTokens(userId, session.id, refreshToken);
  }

  private issueTokens(userId: string, sessionId: string, refreshToken: string): IssuedTokens {
    const payload: JwtPayload = { sub: userId, sid: sessionId };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: this.accessTtlSeconds }),
      accessTokenMaxAgeMs: this.accessTtlSeconds * 1000,
      refreshToken,
      refreshTokenMaxAgeMs: this.refreshTtlMs,
    };
  }
}
