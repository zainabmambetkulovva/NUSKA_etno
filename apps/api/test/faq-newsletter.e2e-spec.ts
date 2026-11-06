import { NewsletterStatus, UserRole } from '@prisma/client';
import request from 'supertest';

import { MailService } from '../src/mail/mail.service';

import { createTestApp, createUser, loginAs, resetDatabase, TestContext } from './utils';

describe('FAQ and newsletter (e2e)', () => {
  let ctx: TestContext;
  let sent: { to: string; text: string }[];

  beforeAll(async () => {
    ctx = await createTestApp();
    const mail = ctx.app.get(MailService);
    jest.spyOn(mail, 'send').mockImplementation(async (to, content) => {
      sent.push({ to, text: content.text });
      return true;
    });
  });
  beforeEach(async () => {
    sent = [];
    await resetDatabase(ctx.prisma);
  });
  afterAll(async () => ctx.app.close());

  const http = () => request(ctx.app.getHttpServer());
  const admin = async () => {
    const user = await createUser(ctx.prisma, UserRole.ADMIN);
    return loginAs(ctx.app, user.email);
  };
  const faqBody = (question: string, category = 'orders') => ({
    category,
    translations: [
      { locale: 'ky', question: `${question} (ky)`, answer: 'Жооп' },
      { locale: 'ru', question, answer: 'Ответ про самовывоз' },
    ],
  });

  describe('FAQ', () => {
    it('admin creates, edits and deletes questions; public list is localised and searchable', async () => {
      const agent = await admin();
      const created = await agent.post('/api/admin/faq').send(faqBody('Как оформить заказ?'));
      expect(created.status).toBe(201);
      await agent.post('/api/admin/faq').send(faqBody('Где забрать?', 'pickup')).expect(201);

      const ky = await http().get('/api/faq?locale=ky').expect(200);
      expect(ky.body.map((i: { question: string }) => i.question)).toEqual([
        'Как оформить заказ? (ky)',
        'Где забрать? (ky)',
      ]);
      const ru = await http().get('/api/faq?locale=ru&search=самовывоз').expect(200);
      expect(ru.body).toHaveLength(2);
      const pickup = await http().get('/api/faq?locale=ru&category=pickup').expect(200);
      expect(pickup.body).toHaveLength(1);

      await agent.patch(`/api/admin/faq/${created.body.id}`).send({ isActive: false }).expect(200);
      expect((await http().get('/api/faq?locale=ru').expect(200)).body).toHaveLength(1);

      await agent.delete(`/api/admin/faq/${created.body.id}`).expect(204);
      await agent.delete(`/api/admin/faq/${created.body.id}`).expect(404);
    });

    it('requires both languages for an active question and admin rights', async () => {
      const agent = await admin();
      const res = await agent.post('/api/admin/faq').send({
        translations: [{ locale: 'ru', question: 'Только русский?', answer: 'Да' }],
      });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_TRANSLATIONS');

      const user = await createUser(ctx.prisma);
      const userAgent = await loginAs(ctx.app, user.email);
      await userAgent.post('/api/admin/faq').send(faqBody('Вопрос?')).expect(403);
      await http().get('/api/admin/faq').expect(401);
    });
  });

  describe('newsletter', () => {
    const subscribe = (email: string, extra: object = {}) =>
      http()
        .post('/api/newsletter/subscribe')
        .send({ email, consent: true, locale: 'ru', ...extra });

    it('double opt-in: subscribe → e-mail with link → confirm', async () => {
      await subscribe('  Guest@Example.com ').expect(200, { ok: true });
      const row = await ctx.prisma.newsletterSubscriber.findUniqueOrThrow({
        where: { email: 'guest@example.com' },
      });
      expect(row.status).toBe(NewsletterStatus.PENDING);
      expect(sent).toHaveLength(1);
      const token = decodeURIComponent(/token=([^\s]+)/.exec(sent[0].text)![1]);
      expect(sent[0].text).toContain('/ru/newsletter/confirm?token=');

      await http().post('/api/newsletter/confirm').send({ token }).expect(200);
      const confirmed = await ctx.prisma.newsletterSubscriber.findUniqueOrThrow({
        where: { id: row.id },
      });
      expect(confirmed.status).toBe(NewsletterStatus.ACTIVE);
      expect(confirmed.confirmTokenHash).toBeNull();

      // Reusing the link fails; subscribing again changes nothing and sends nothing.
      const reused = await http().post('/api/newsletter/confirm').send({ token });
      expect(reused.body.code).toBe('INVALID_TOKEN');
      await subscribe('guest@example.com').expect(200, { ok: true });
      expect(sent).toHaveLength(1);
    });

    it('does not resend within 10 minutes and requires consent and a valid e-mail', async () => {
      await subscribe('a@example.com').expect(200);
      await subscribe('a@example.com').expect(200);
      expect(sent).toHaveLength(1);
      expect(await ctx.prisma.newsletterSubscriber.count()).toBe(1);

      await subscribe('b@example.com', { consent: false }).expect(422);
      await subscribe('not-an-email').expect(422);
      await http().post('/api/newsletter/confirm').send({ token: 'nope' }).expect(400);
    });

    it('admin lists, exports confirmed subscribers and unsubscribes', async () => {
      await subscribe('one@example.com').expect(200);
      const token = decodeURIComponent(/token=([^\s]+)/.exec(sent[0].text)![1]);
      await http().post('/api/newsletter/confirm').send({ token }).expect(200);
      await subscribe('two@example.com').expect(200);

      const agent = await admin();
      const list = await agent.get('/api/admin/newsletter?status=ACTIVE').expect(200);
      expect(list.body.meta.total).toBe(1);
      expect(list.body.data[0]).not.toHaveProperty('confirmTokenHash');

      const csv = await agent.get('/api/admin/newsletter/export').expect(200);
      expect(csv.headers['content-type']).toContain('text/csv');
      expect(csv.text).toContain('one@example.com,ru,');
      expect(csv.text).not.toContain('two@example.com');

      await agent.post(`/api/admin/newsletter/${list.body.data[0].id}/unsubscribe`).expect(204);
      const after = await agent.get('/api/admin/newsletter?status=UNSUBSCRIBED').expect(200);
      expect(after.body.meta.total).toBe(1);
      const audit = await ctx.prisma.auditLog.count({
        where: { action: 'newsletter.unsubscribe' },
      });
      expect(audit).toBe(1);
    });
  });
});
