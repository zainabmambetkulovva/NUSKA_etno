import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { isLocale } from '../common/utils/locale';

import { ACCESS_COOKIE, AuthCookies, OAUTH_COOKIE, REFRESH_COOKIE } from './auth.cookies';
import { AuthService, ClientMeta } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { GoogleAuthService, GoogleOAuthState } from './google-auth.service';

const STRICT_LIMIT = { default: { limit: 5, ttl: 60_000 } };

function clientMeta(request: Request): ClientMeta {
  return { userAgent: request.header('user-agent'), ipAddress: request.clientIp ?? request.ip };
}

function refreshCookie(request: Request): string | undefined {
  const value = request.cookies?.[REFRESH_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
    private readonly google: GoogleAuthService
  ) {}

  /** Sign-in methods available on the website. */
  @Public()
  @Get('providers')
  providers() {
    return { google: this.google.configured };
  }

  /** Redirects to Google; `locale` and `next` decide where the user returns. */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('google')
  googleStart(
    @Query('locale') locale: string | undefined,
    @Query('next') next: string | undefined,
    @Res() res: Response
  ) {
    const { url, state } = this.google.start(locale, next);
    this.cookies.setOAuth(res, Buffer.from(JSON.stringify(state)).toString('base64url'));
    res.redirect(302, url);
  }

  /** Google returns here (through the website proxy); on success the session cookies are set. */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') stateParam: string | undefined,
    @Req() req: Request,
    @Res() res: Response
  ) {
    let saved: GoogleOAuthState | null = null;
    try {
      const raw = req.cookies?.[OAUTH_COOKIE];
      saved = typeof raw === 'string' ? JSON.parse(Buffer.from(raw, 'base64url').toString()) : null;
    } catch {
      saved = null;
    }
    this.cookies.clearOAuth(res);
    const locale = saved && isLocale(saved.locale) ? saved.locale : 'ky';
    const fail = (reason: string) =>
      res.redirect(302, `${this.google.webUrl}/${locale}/login?error=${reason}`);

    if (!saved || !stateParam || saved.state !== stateParam || typeof code !== 'string')
      return fail('google');
    try {
      const profile = await this.google.profile(code, saved.verifier);
      const { tokens } = await this.auth.loginWithGoogle(profile, locale, clientMeta(req));
      this.cookies.set(res, tokens);
      return res.redirect(302, `${this.google.webUrl}${this.google.safeNext(locale, saved.next)}`);
    } catch (error) {
      const code = (error as { response?: { code?: string } }).response?.code;
      return fail(code === 'ACCOUNT_DISABLED' ? 'disabled' : 'google');
    }
  }

  @Public()
  @Throttle(STRICT_LIMIT)
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const { user, tokens } = await this.auth.register(dto, clientMeta(req));
    this.cookies.set(res, tokens);
    return { user };
  }

  @Public()
  @Throttle(STRICT_LIMIT)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const { user, tokens } = await this.auth.login(dto, clientMeta(req));
    this.cookies.set(res, tokens);
    return { user };
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const { user, tokens } = await this.auth.refresh(refreshCookie(req), clientMeta(req));
      this.cookies.set(res, tokens);
      return { user };
    } catch (error) {
      this.cookies.clear(res);
      throw error;
    }
  }

  /**
   * Current user for the frontend, always 200: { user } or { user: null }.
   * If the access token expired but the refresh token is valid, the session is
   * rotated here, so pages need one request instead of 401 → refresh → retry.
   */
  @Public()
  @SkipThrottle()
  @Get('session')
  async session(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const access = req.cookies?.[ACCESS_COOKIE];
    if (typeof access === 'string' && access) {
      const user = await this.auth.userFromAccessToken(access);
      if (user) return { user };
    }
    const refresh = refreshCookie(req);
    if (!refresh) return { user: null };
    try {
      const { user, tokens } = await this.auth.refresh(refresh, clientMeta(req));
      this.cookies.set(res, tokens);
      return { user };
    } catch {
      this.cookies.clear(res);
      return { user: null };
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(refreshCookie(req));
    this.cookies.clear(res);
  }

  @Public()
  @Throttle(STRICT_LIMIT)
  @Post('password/forgot')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto);
  }

  @Public()
  @Throttle(STRICT_LIMIT)
  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto, @Res({ passthrough: true }) res: Response) {
    await this.auth.resetPassword(dto);
    this.cookies.clear(res);
  }

  @Public()
  @Throttle(STRICT_LIMIT)
  @Post('email/verify')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.auth.verifyEmail(dto.token);
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('email/resend')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resendVerification(@CurrentUser() user: AuthenticatedUser) {
    await this.auth.resendEmailVerification(user.id);
  }
}
