import { UserRole } from '@prisma/client';
import request from 'supertest';

import { createTestApp, createUser, loginAs, resetDatabase, TestContext } from './utils';

describe('Testimonials (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });
  afterAll(async () => ctx.app.close());

  const http = () => request(ctx.app.getHttpServer());
  const body = {
    authorName: 'Айдана Теребаева',
    text: 'Бал абдан даамдуу экен!',
    rating: 5,
    reviewDate: '2026-10-28',
    productName: 'Бал',
    instagramUrl: 'https://www.instagram.com/p/abc/',
  };

  it('admin creates, hides, edits and deletes testimonials; the public list shows only published ones', async () => {
    const admin = await loginAs(ctx.app, (await createUser(ctx.prisma, UserRole.ADMIN)).email);
    const created = await admin.post('/api/admin/testimonials').send(body).expect(201);
    expect(created.body).toMatchObject({
      authorName: body.authorName,
      reviewDate: '2026-10-28',
      isPublished: true,
      isDemo: false,
    });
    await admin
      .post('/api/admin/testimonials')
      .send({ ...body, authorName: 'Гүлнур', sortOrder: 2 })
      .expect(201);

    const list = await http().get('/api/testimonials').expect(200);
    expect(list.body.map((t: { authorName: string }) => t.authorName)).toEqual([
      body.authorName,
      'Гүлнур',
    ]);
    expect(list.body[0]).not.toHaveProperty('isPublished');

    await admin
      .patch(`/api/admin/testimonials/${created.body.id}`)
      .send({ isPublished: false, photoUrl: null })
      .expect(200);
    expect((await http().get('/api/testimonials').expect(200)).body).toHaveLength(1);
    expect((await admin.get('/api/admin/testimonials').expect(200)).body).toHaveLength(2);

    await admin.delete(`/api/admin/testimonials/${created.body.id}`).expect(204);
    await admin.delete(`/api/admin/testimonials/${created.body.id}`).expect(404);
  });

  it('validates the data and is admin-only', async () => {
    const admin = await loginAs(ctx.app, (await createUser(ctx.prisma, UserRole.ADMIN)).email);
    await admin
      .post('/api/admin/testimonials')
      .send({ ...body, rating: 6 })
      .expect(422);
    await admin
      .post('/api/admin/testimonials')
      .send({ ...body, reviewDate: '28.10.2026' })
      .expect(422);
    await admin
      .post('/api/admin/testimonials')
      .send({ ...body, instagramUrl: 'https://evil.example/x' })
      .expect(422);
    await admin
      .post('/api/admin/testimonials')
      .send({ ...body, photoUrl: 'javascript:alert(1)' })
      .expect(422);

    const customer = await loginAs(ctx.app, (await createUser(ctx.prisma, UserRole.USER)).email);
    await customer.post('/api/admin/testimonials').send(body).expect(403);
    await http().get('/api/admin/testimonials').expect(401);
  });
});
