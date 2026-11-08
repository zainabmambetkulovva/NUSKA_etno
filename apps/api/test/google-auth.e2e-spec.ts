import request from 'supertest';

import { createTestApp, createUser, resetDatabase, TestContext } from './utils';

const CLIENT_ID = 'test-client.apps.googleusercontent.com';

describe('Sign in with Google (e2e)', () => {
  let ctx: TestContext;
  let fetchSpy: jest.SpyInstance;
  let tokenInfo: Record<string, string>;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
    ctx = await createTestApp();
  });
  afterAll(async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    await ctx.app.close();
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    tokenInfo = {
      aud: CLIENT_ID,
      iss: 'https://accounts.google.com',
      exp: String(Math.floor(Date.now() / 1000) + 600),
      email_verified: 'true',
      sub: 'google-123',
      email: 'Aidai@Example.com',
      given_name: 'Айдай',
      family_name: 'Асанова',
    };
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith('https://oauth2.googleapis.com/tokeninfo'))
        return new Response(JSON.stringify(tokenInfo), { status: 200 });
      if (url === 'https://oauth2.googleapis.com/token')
        return new Response(JSON.stringify({ id_token: 'id-token' }), { status: 200 });
      throw new Error(`unexpected fetch ${url}`);
    });
  });
  afterEach(() => fetchSpy.mockRestore());

  const http = () => request(ctx.app.getHttpServer());

  /** Starts the flow and returns the state and the cookie to send back. */
  const start = async (query = 'locale=ru&next=/ru/checkout') => {
    const res = await http().get(`/api/auth/google?${query}`).expect(302);
    const location = new URL(res.headers.location);
    expect(location.origin + location.pathname).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth'
    );
    expect(location.searchParams.get('code_challenge_method')).toBe('S256');
    expect(location.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/api/auth/google/callback'
    );
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith('nuska_oauth=')
    )!;
    expect(cookie).toContain('HttpOnly');
    return { state: location.searchParams.get('state')!, cookie: cookie.split(';')[0] };
  };

  it('reports the provider', async () => {
    expect((await http().get('/api/auth/providers').expect(200)).body).toEqual({ google: true });
  });

  it('creates an account, signs in and returns to the page', async () => {
    const { state, cookie } = await start();
    const res = await http()
      .get(`/api/auth/google/callback?code=abc&state=${state}`)
      .set('Cookie', cookie)
      .expect(302);
    expect(res.headers.location).toBe('http://localhost:3000/ru/checkout');
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('nuska_access='))).toBe(true);

    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email: 'aidai@example.com' } });
    expect(user).toMatchObject({
      googleId: 'google-123',
      passwordHash: null,
      firstName: 'Айдай',
      locale: 'ru',
    });
    expect(user.emailVerifiedAt).not.toBeNull();

    // A Google-only account cannot sign in with a password.
    const login = await http()
      .post('/api/auth/login')
      .send({ email: 'aidai@example.com', password: 'whatever-123' });
    expect(login.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('links Google to an existing account with the same e-mail', async () => {
    const existing = await createUser(ctx.prisma);
    tokenInfo.email = existing.email;
    const { state, cookie } = await start('locale=ky');
    const res = await http()
      .get(`/api/auth/google/callback?code=abc&state=${state}`)
      .set('Cookie', cookie)
      .expect(302);
    expect(res.headers.location).toBe('http://localhost:3000/ky/account');
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: existing.id } });
    expect(user.googleId).toBe('google-123');
    expect(user.passwordHash).not.toBeNull();
    expect(await ctx.prisma.user.count()).toBe(1);
  });

  it('rejects a wrong state, a foreign token and open redirects', async () => {
    const { cookie } = await start();
    const bad = await http()
      .get('/api/auth/google/callback?code=abc&state=forged')
      .set('Cookie', cookie)
      .expect(302);
    expect(bad.headers.location).toBe('http://localhost:3000/ru/login?error=google');

    tokenInfo.aud = 'someone-else';
    const second = await start();
    const foreign = await http()
      .get(`/api/auth/google/callback?code=abc&state=${second.state}`)
      .set('Cookie', second.cookie)
      .expect(302);
    expect(foreign.headers.location).toBe('http://localhost:3000/ru/login?error=google');
    expect(await ctx.prisma.user.count()).toBe(0);

    tokenInfo.aud = CLIENT_ID;
    const third = await start('locale=ru&next=https://evil.example');
    const ok = await http()
      .get(`/api/auth/google/callback?code=abc&state=${third.state}`)
      .set('Cookie', third.cookie)
      .expect(302);
    expect(ok.headers.location).toBe('http://localhost:3000/ru/account');
  });

  it('does not sign in a disabled account', async () => {
    const user = await createUser(ctx.prisma);
    await ctx.prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
    tokenInfo.email = user.email;
    const { state, cookie } = await start('locale=ky');
    const res = await http()
      .get(`/api/auth/google/callback?code=abc&state=${state}`)
      .set('Cookie', cookie)
      .expect(302);
    expect(res.headers.location).toBe('http://localhost:3000/ky/login?error=disabled');
  });
});
