import { validateEnv } from './env.validation';

const base = { DATABASE_URL: 'postgresql://localhost/db', JWT_SECRET: 'x'.repeat(32) };

describe('validateEnv', () => {
  it('applies safe defaults', () => {
    const env = validateEnv(base);
    expect(env).toMatchObject({
      PORT: 4000,
      JWT_EXPIRES_IN: '15m',
      COOKIE_SAMESITE: 'lax',
      COOKIE_SECURE: false,
    });
  });

  it('requires a strong JWT secret and a database URL', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
    expect(() => validateEnv({ JWT_SECRET: base.JWT_SECRET })).toThrow(/DATABASE_URL/);
  });

  it('uses secure cookies and disables Swagger in production by default', () => {
    const env = validateEnv({ ...base, NODE_ENV: 'production' });
    expect(env).toMatchObject({ COOKIE_SECURE: true, SWAGGER_ENABLED: false });
  });

  it('rejects SameSite=None without Secure', () => {
    expect(() => validateEnv({ ...base, COOKIE_SAMESITE: 'none', COOKIE_SECURE: 'false' })).toThrow(
      /COOKIE_SECURE/
    );
  });
});
