/**
 * Validates environment variables at startup so the API never runs with a
 * missing or weak secret.
 */
export interface AppEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_TTL_DAYS: number;
  BCRYPT_ROUNDS: number;
  CORS_ORIGINS: string[];
  WEB_URL: string;
  COOKIE_SECURE: boolean;
  COOKIE_SAMESITE: 'lax' | 'strict' | 'none';
  COOKIE_DOMAIN?: string;
  TRUST_PROXY: boolean;
  SWAGGER_ENABLED: boolean;
  PROXY_SECRET?: string;
}

function bool(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

function int(name: string, value: unknown, fallback: number, min: number, max: number): number {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

export function validateEnv(raw: Record<string, unknown>): Record<string, unknown> {
  const errors: string[] = [];
  const nodeEnv = (raw.NODE_ENV as string) || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push('NODE_ENV must be development, production or test');
  }
  const isProduction = nodeEnv === 'production';

  if (!raw.DATABASE_URL) errors.push('DATABASE_URL is required');

  const jwtSecret = (raw.JWT_SECRET as string) || '';
  if (jwtSecret.length < 32)
    errors.push('JWT_SECRET is required and must be at least 32 characters');

  const sameSite = ((raw.COOKIE_SAMESITE as string) || 'lax').toLowerCase();
  if (!['lax', 'strict', 'none'].includes(sameSite)) {
    errors.push('COOKIE_SAMESITE must be lax, strict or none');
  }
  const cookieSecure = bool(raw.COOKIE_SECURE, isProduction);
  if (sameSite === 'none' && !cookieSecure)
    errors.push('COOKIE_SAMESITE=none requires COOKIE_SECURE=true');

  const proxySecret = (raw.PROXY_SECRET as string) || undefined;
  if (proxySecret && proxySecret.length < 32)
    errors.push('PROXY_SECRET must be at least 32 characters');
  // In production the API must only be reachable through the website's proxy (real client IPs, no direct access).
  if (isProduction && !proxySecret) errors.push('PROXY_SECRET is required in production');

  let env: AppEnv | undefined;
  try {
    env = {
      NODE_ENV: nodeEnv as AppEnv['NODE_ENV'],
      PORT: int('PORT', raw.PORT, 4000, 1, 65535),
      DATABASE_URL: raw.DATABASE_URL as string,
      JWT_SECRET: jwtSecret,
      JWT_EXPIRES_IN: (raw.JWT_EXPIRES_IN as string) || '15m',
      REFRESH_TOKEN_TTL_DAYS: int('REFRESH_TOKEN_TTL_DAYS', raw.REFRESH_TOKEN_TTL_DAYS, 30, 1, 365),
      BCRYPT_ROUNDS: int('BCRYPT_ROUNDS', raw.BCRYPT_ROUNDS, 12, 4, 15),
      CORS_ORIGINS: ((raw.CORS_ORIGINS as string) || 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
      WEB_URL: ((raw.WEB_URL as string) || 'http://localhost:3000').replace(/\/$/, ''),
      COOKIE_SECURE: cookieSecure,
      COOKIE_SAMESITE: sameSite as AppEnv['COOKIE_SAMESITE'],
      COOKIE_DOMAIN: (raw.COOKIE_DOMAIN as string) || undefined,
      TRUST_PROXY: bool(raw.TRUST_PROXY, false),
      SWAGGER_ENABLED: bool(raw.SWAGGER_ENABLED, !isProduction),
      PROXY_SECRET: proxySecret,
    };
  } catch (error) {
    errors.push((error as Error).message);
  }

  if (errors.length > 0 || !env) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }
  return { ...raw, ...env };
}
