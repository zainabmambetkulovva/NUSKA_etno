import request from 'supertest';

import { PROXY_SECRET } from './proxy-env';
import { createTestApp, createUser, resetDatabase, TestContext } from './utils';

describe('Access through the website proxy only (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(async () => resetDatabase(ctx.prisma));
  afterAll(async () => ctx.app.close());

  const http = () => request(ctx.app.getHttpServer());
  const viaProxy = (ip: string) => ({ 'x-proxy-secret': PROXY_SECRET, 'x-client-ip': ip });

  it('refuses direct requests but keeps the health check open', async () => {
    const direct = await http().get('/api/products').expect(403);
    expect(direct.body.code).toBe('DIRECT_ACCESS_FORBIDDEN');
    await http()
      .get('/api/products')
      .set('x-proxy-secret', 'wrong-secret-of-the-same-length-000000000')
      .expect(403);
    await http().get('/api/health').expect(200);
    await http().get('/api/products').set(viaProxy('203.0.113.1')).expect(200);
  });

  it('rate-limits logins per real client IP, not per proxy', async () => {
    const user = await createUser(ctx.prisma);
    const attempt = (ip: string) =>
      http()
        .post('/api/auth/login')
        .set(viaProxy(ip))
        .send({ email: user.email, password: 'Wrong1234' });

    for (let i = 0; i < 5; i++) expect((await attempt('203.0.113.10')).status).toBe(401);
    expect((await attempt('203.0.113.10')).status).toBe(429);
    // Another customer behind the same proxy is not affected.
    expect((await attempt('203.0.113.20')).status).toBe(401);

    const session = await ctx.prisma.session.count();
    expect(session).toBe(0);
  });

  it('does not rate-limit server-side rendering requests of the website', async () => {
    const user = await createUser(ctx.prisma);
    for (let i = 0; i < 7; i++) {
      const res = await http()
        .post('/api/auth/login')
        .set('x-proxy-secret', PROXY_SECRET)
        .send({ email: user.email, password: 'Wrong1234' });
      expect(res.status).toBe(401);
    }
  });
});
