import { UserRole } from '@prisma/client';
import request from 'supertest';

import { MailService } from '../src/mail/mail.service';

import { createTestApp, createUser, loginAs, PASSWORD, resetDatabase, TestContext } from './utils';

function cookieValue(setCookie: string[] | string | undefined, name: string): string | undefined {
  const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const cookie = list.find((c) => c.startsWith(`${name}=`));
  return cookie?.split(';')[0].slice(name.length + 1);
}

describe('Auth & users (e2e)', () => {
  let ctx: TestContext;
  let sentMail: { to: string; text: string }[];

  beforeAll(async () => {
    ctx = await createTestApp();
    jest.spyOn(ctx.app.get(MailService), 'send').mockImplementation(async (to, content) => {
      sentMail.push({ to, text: content.text });
      return true;
    });
  });
  beforeEach(async () => {
    sentMail = [];
    await resetDatabase(ctx.prisma);
  });
  afterAll(async () => ctx.app.close());

  const http = () => request(ctx.app.getHttpServer());

  it('registers a user, sets httpOnly cookies and never returns the password hash', async () => {
    const res = await http()
      .post('/api/auth/register')
      .send({
        email: 'New@Example.com',
        password: 'Secret123',
        firstName: 'Айгуль',
        phone: '0555 12-34-56',
        locale: 'ky',
      })
      .expect(201);

    expect(res.body.user).toMatchObject({
      email: 'new@example.com',
      phone: '+996555123456',
      locale: 'ky',
      role: 'USER',
    });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.find((c) => c.startsWith('nuska_access='))).toMatch(/HttpOnly/);
    expect(cookies.find((c) => c.startsWith('nuska_refresh='))).toMatch(/Path=\/api\/auth/);
    expect(sentMail[0].to).toBe('new@example.com');
  });

  it('rejects duplicate e-mails, weak passwords and unknown fields', async () => {
    const body = { email: 'dup@example.com', password: 'Secret123', firstName: 'A' };
    await http().post('/api/auth/register').send(body).expect(201);
    const dup = await http()
      .post('/api/auth/register')
      .send({ ...body, email: 'DUP@example.com' })
      .expect(409);
    expect(dup.body.code).toBe('EMAIL_TAKEN');

    await http()
      .post('/api/auth/register')
      .send({ ...body, email: 'w@example.com', password: 'short' })
      .expect(422);
    await http()
      .post('/api/auth/register')
      .send({ ...body, email: 'w@example.com', password: 'onlyletters' })
      .expect(422);
    const unknownField = await http()
      .post('/api/auth/register')
      .send({ ...body, email: 'role@example.com', role: 'ADMIN' })
      .expect(422);
    expect(unknownField.body).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'role', messages: ['property role should not exist'] }],
    });
  });

  it('returns the same error for a wrong password and an unknown e-mail', async () => {
    const user = await createUser(ctx.prisma);
    const wrong = await http()
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Wrong1234' })
      .expect(401);
    const unknown = await http()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Wrong1234' })
      .expect(401);
    expect(wrong.body.code).toBe('INVALID_CREDENTIALS');
    expect(unknown.body).toEqual(wrong.body);
  });

  it('requires authentication by default and admin role for /admin', async () => {
    await http().get('/api/users/me').expect(401);
    await http().get('/api/cart').expect(401);
    await http().get('/api/admin/dashboard').expect(401);

    const user = await createUser(ctx.prisma);
    const agent = await loginAs(ctx.app, user.email);
    await agent.get('/api/users/me').expect(200);
    const forbidden = await agent.get('/api/admin/dashboard').expect(403);
    expect(forbidden.body).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });

    const admin = await createUser(ctx.prisma, UserRole.ADMIN);
    const adminAgent = await loginAs(ctx.app, admin.email);
    await adminAgent.get('/api/admin/dashboard').expect(200);
  });

  it('does not allow a user to change role, e-mail or other users through the profile', async () => {
    const user = await createUser(ctx.prisma);
    const other = await createUser(ctx.prisma);
    const agent = await loginAs(ctx.app, user.email);

    await agent.patch('/api/users/me').send({ role: 'ADMIN' }).expect(422);
    await agent.patch('/api/users/me').send({ email: 'x@example.com' }).expect(422);
    await agent.patch(`/api/users/${other.id}`).send({ firstName: 'Hacked' }).expect(404);

    const res = await agent
      .patch('/api/users/me')
      .send({ firstName: 'Нурлан', phone: '+996 700 11 22 33' })
      .expect(200);
    expect(res.body).toMatchObject({ firstName: 'Нурлан', phone: '+996700112233', role: 'USER' });
    await agent.patch('/api/users/me').send({ phone: '12' }).expect(400);
  });

  it('rotates refresh tokens and rejects a reused one', async () => {
    const user = await createUser(ctx.prisma);
    const login = await http()
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD })
      .expect(200);
    const refresh1 = cookieValue(login.headers['set-cookie'], 'nuska_refresh');

    const rotated = await http()
      .post('/api/auth/refresh')
      .set('Cookie', `nuska_refresh=${refresh1}`)
      .expect(200);
    const refresh2 = cookieValue(rotated.headers['set-cookie'], 'nuska_refresh');
    expect(refresh2).toBeDefined();
    expect(refresh2).not.toEqual(refresh1);

    const reused = await http()
      .post('/api/auth/refresh')
      .set('Cookie', `nuska_refresh=${refresh1}`)
      .expect(401);
    expect(reused.body.code).toBe('SESSION_EXPIRED');
    await http().post('/api/auth/refresh').set('Cookie', `nuska_refresh=${refresh2}`).expect(200);
  });

  it('logout ends the session immediately', async () => {
    const user = await createUser(ctx.prisma);
    const agent = await loginAs(ctx.app, user.email);
    await agent.get('/api/users/me').expect(200);

    const login = await http()
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD });
    const access = cookieValue(login.headers['set-cookie'], 'nuska_access');
    const refresh = cookieValue(login.headers['set-cookie'], 'nuska_refresh');
    await http().post('/api/auth/logout').set('Cookie', `nuska_refresh=${refresh}`).expect(204);
    // The access JWT is still within its lifetime but its session is gone.
    await http().get('/api/users/me').set('Cookie', `nuska_access=${access}`).expect(401);
    // Other sessions are unaffected.
    await agent.get('/api/users/me').expect(200);
  });

  it('blocking a user or changing their role ends their sessions', async () => {
    const admin = await createUser(ctx.prisma, UserRole.ADMIN);
    const user = await createUser(ctx.prisma);
    const adminAgent = await loginAs(ctx.app, admin.email);
    const userAgent = await loginAs(ctx.app, user.email);

    await adminAgent.patch(`/api/admin/users/${user.id}`).send({ isActive: false }).expect(200);
    await userAgent.get('/api/users/me').expect(401);
    const login = await http()
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD })
      .expect(403);
    expect(login.body.code).toBe('ACCOUNT_DISABLED');

    await adminAgent.patch(`/api/admin/users/${admin.id}`).send({ role: 'USER' }).expect(400);

    const audit = await ctx.prisma.auditLog.findMany({ where: { entityId: user.id } });
    expect(audit).toHaveLength(1);
    expect(audit[0].action).toBe('user.update');
  });

  it('resets a password with a one-time e-mailed token and signs out everywhere', async () => {
    const user = await createUser(ctx.prisma);
    const agent = await loginAs(ctx.app, user.email);

    await http()
      .post('/api/auth/password/forgot')
      .send({ email: 'unknown@example.com' })
      .expect(204);
    expect(sentMail).toHaveLength(0);

    await http().post('/api/auth/password/forgot').send({ email: user.email }).expect(204);
    const token = decodeURIComponent(/token=([^\s]+)/.exec(sentMail[0].text)![1]);

    await http()
      .post('/api/auth/password/reset')
      .send({ token, password: 'NewSecret99' })
      .expect(204);
    await http()
      .post('/api/auth/password/reset')
      .send({ token, password: 'Another999' })
      .expect(400);
    await agent.get('/api/users/me').expect(401);

    await http()
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD })
      .expect(401);
    await http()
      .post('/api/auth/login')
      .send({ email: user.email, password: 'NewSecret99' })
      .expect(200);
  });

  it('verifies e-mail with the token from the registration mail', async () => {
    const agent = request.agent(ctx.app.getHttpServer());
    await agent
      .post('/api/auth/register')
      .send({ email: 'v@example.com', password: 'Secret123', firstName: 'V' })
      .expect(201);
    const token = decodeURIComponent(/token=([^\s]+)/.exec(sentMail[0].text)![1]);

    expect((await agent.get('/api/users/me')).body.emailVerified).toBe(false);
    await http().post('/api/auth/email/verify').send({ token }).expect(204);
    expect((await agent.get('/api/users/me')).body.emailVerified).toBe(true);
    await http().post('/api/auth/email/verify').send({ token }).expect(400);
  });

  it('changing the password keeps the current session and ends the others', async () => {
    const user = await createUser(ctx.prisma);
    const current = await loginAs(ctx.app, user.email);
    const other = await loginAs(ctx.app, user.email);

    await current
      .post('/api/users/me/password')
      .send({ currentPassword: 'wrong', password: 'NewSecret99' })
      .expect(400);
    await current
      .post('/api/users/me/password')
      .send({ currentPassword: PASSWORD, password: 'NewSecret99' })
      .expect(204);
    await current.get('/api/users/me').expect(200);
    await other.get('/api/users/me').expect(401);
  });
});
