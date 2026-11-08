import { createHash } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppError } from '../common/errors';
import { DEFAULT_LOCALE, isLocale, Locale } from '../common/utils/locale';
import { generateToken } from '../common/utils/tokens';

/** State kept in a short-lived httpOnly cookie between the redirect to Google and the callback. */
export interface GoogleOAuthState {
  state: string;
  verifier: string;
  locale: Locale;
  next: string;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

/**
 * "Sign in with Google" (OAuth 2.0 authorization code flow with PKCE and a
 * state parameter). Configured with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
 * (server environment only). The redirect URI goes through the website:
 * `${WEB_URL}/api/auth/google/callback`.
 */
@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  readonly webUrl: string;
  private readonly redirectUri: string;

  constructor(config: ConfigService) {
    this.clientId = config.get<string>('GOOGLE_CLIENT_ID') || undefined;
    this.clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET') || undefined;
    this.webUrl = (config.get<string>('WEB_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
    this.redirectUri =
      config.get<string>('GOOGLE_REDIRECT_URI') || `${this.webUrl}/api/auth/google/callback`;
  }

  get configured() {
    return Boolean(this.clientId && this.clientSecret);
  }

  /** Only site-relative paths of the chosen language are accepted (no open redirects). */
  safeNext(locale: Locale, next: unknown) {
    return typeof next === 'string' && /^\/(ky|ru)(\/[\w\-/]*)?$/.test(next) && !next.includes('//')
      ? next
      : `/${locale}/account`;
  }

  start(localeInput: unknown, nextInput: unknown): { url: string; state: GoogleOAuthState } {
    if (!this.configured)
      throw AppError.notFound('GOOGLE_NOT_CONFIGURED', 'Google sign-in is not configured');
    const locale = isLocale(localeInput) ? localeInput : DEFAULT_LOCALE;
    const state: GoogleOAuthState = {
      state: generateToken(),
      verifier: generateToken(),
      locale,
      next: this.safeNext(locale, nextInput),
    };
    const challenge = createHash('sha256').update(state.verifier).digest('base64url');
    const params = new URLSearchParams({
      client_id: this.clientId!,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: state.state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });
    return { url: `${AUTH_URL}?${params.toString()}`, state };
  }

  /** Exchanges the code and returns the verified Google profile. */
  async profile(code: string, verifier: string): Promise<GoogleProfile> {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
    });
    if (!tokenResponse.ok) {
      this.logger.warn(`Google token exchange failed: ${tokenResponse.status}`);
      throw AppError.unauthorized('GOOGLE_FAILED', 'Google sign-in failed');
    }
    const { id_token: idToken } = (await tokenResponse.json()) as { id_token?: string };
    if (!idToken) throw AppError.unauthorized('GOOGLE_FAILED', 'Google sign-in failed');

    // Google validates the signature; we check the audience, issuer, expiry and e-mail.
    const infoResponse = await fetch(`${TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`);
    if (!infoResponse.ok) throw AppError.unauthorized('GOOGLE_FAILED', 'Google sign-in failed');
    const info = (await infoResponse.json()) as Record<string, string | undefined>;
    const valid =
      info.aud === this.clientId &&
      ISSUERS.has(info.iss ?? '') &&
      Number(info.exp) * 1000 > Date.now() &&
      info.email_verified === 'true' &&
      Boolean(info.sub) &&
      Boolean(info.email);
    if (!valid) throw AppError.unauthorized('GOOGLE_FAILED', 'Google sign-in failed');
    return {
      sub: info.sub!,
      email: info.email!.toLowerCase(),
      firstName: info.given_name?.slice(0, 100) || null,
      lastName: info.family_name?.slice(0, 100) || null,
    };
  }
}
