# Запуск в интернет (production)

Схема:

```text
Покупатель ──HTTPS──▶ Vercel (сайт Next.js, регион fra1)
                         │  /api/*  → прокси добавляет X-Proxy-Secret и IP покупателя
                         ▼
                    Fly.io (API NestJS, регион fra, Docker)
                         │
                         ├──▶ Neon PostgreSQL (eu-central-1, Франкфурт)
                         ├──▶ Cloudflare R2 (фото товаров)
                         └──▶ SMTP (Resend или Brevo: письма)
```

- Браузер ходит **только на сайт**. API напрямую из интернета закрыт: без секретного
  заголовка он отвечает `403` (открыт только `/api/health` для проверок Fly).
- Секреты вводятся **только в панелях Vercel / Fly / Neon**, никогда не в git и не в чат.
- Миграции БД применяются автоматически при каждом деплое API (`release_command` в `apps/api/fly.toml`);
  при ошибке миграции новая версия не запускается.

Порядок: Neon → секреты → Fly.io (API) → наполнение БД → Vercel (сайт) → R2 → почта → домен.

---

## 1. Neon (база данных)

1. https://neon.tech → **New project**, регион **AWS Europe Central 1 (Frankfurt)**, PostgreSQL 16+.
2. **Connection details** → скопируйте две строки:
   - **Pooled** (в адресе есть `-pooler`) → это `DATABASE_URL`. Допишите в конец `&pgbouncer=true&connect_timeout=15`.
   - **Direct** (без `-pooler`) → это `DIRECT_URL` (для миграций).
   Обе строки должны содержать `sslmode=require`.

## 2. Секреты

Сгенерируйте два случайных ключа (каждый — отдельной командой):

```bash
openssl rand -base64 48
```

- первый → `JWT_SECRET` (только для API);
- второй → `PROXY_SECRET` в API **и такой же** `API_PROXY_SECRET` в Vercel.

## 3. Fly.io (API)

1. Установите flyctl: https://fly.io/docs/flyctl/install/ и войдите:

```bash
fly auth login
```

2. Создайте приложение (если имя `nuska-etno` занято — выберите другое и поменяйте `app` в `apps/api/fly.toml`):

```bash
fly apps create nuska-etno
```

3. Задайте секреты (подставьте свои значения; адрес сайта можно сначала указать адрес Vercel, потом заменить на домен):

```bash
fly secrets set -a nuska-etno DATABASE_URL='…pooled…' DIRECT_URL='…direct…' JWT_SECRET='…' PROXY_SECRET='…' WEB_URL='https://<адрес сайта>'
```

4. Деплой из корня репозитория:

```bash
fly deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile .
```

5. Проверка: `https://nuska-etno.fly.dev/api/health` → `{"status":"healthy","database":"up"}`,
   а `https://nuska-etno.fly.dev/api/products` → `403` (так и должно быть).

## 4. Наполнение базы (один раз, со своего компьютера)

Каталог из прайса, категории, контакты и список магазинов — **без** демо-заказов,
демо-пользователей и демо-точки самовывоза:

```bash
DATABASE_URL='…direct…' SEED_DEMO=false pnpm db:seed
```

Первый администратор (пароль 12–72 символа, буквы и цифры):

```bash
DATABASE_URL='…direct…' ADMIN_EMAIL='owner@…' ADMIN_PASSWORD='…' ADMIN_FIRST_NAME='…' pnpm --filter @nuska/api admin:create
```

После этого очистите историю терминала (пароль попал в неё).

## 5. Vercel (сайт)

1. https://vercel.com → **Add New → Project** → импорт репозитория из GitHub.
2. **Root Directory:** `apps/web` (Framework определится как Next.js, pnpm — автоматически).
3. **Environment Variables** (Production):

| Переменная | Значение |
|---|---|
| `API_INTERNAL_URL` | `https://nuska-etno.fly.dev` |
| `API_PROXY_SECRET` | тот же ключ, что `PROXY_SECRET` в Fly |
| `NEXT_PUBLIC_SITE_URL` | адрес сайта, например `https://<проект>.vercel.app` (потом — домен) |
| `NEXT_PUBLIC_IMAGES_HOST` | хост R2 (шаг 6), можно добавить позже |

4. **Deploy**. Откройте сайт → `/ky`, войдите администратором → `/ky/admin`.
5. Если адрес сайта отличается от `WEB_URL` в Fly — обновите:

```bash
fly secrets set -a nuska-etno WEB_URL='https://<адрес сайта>'
```

## 6. Cloudflare R2 (фото товаров)

1. Cloudflare → **R2** → **Create bucket** (например `nuska-images`), регион Eastern Europe (EEUR) или Automatic.
2. Публичный доступ: **Settings → Public access** → подключите свой поддомен
   (например `img.<домен>`) или включите `r2.dev` (для тестов).
3. **Manage R2 API Tokens** → токен с правами **Object Read & Write** на этот бакет.
4. Секреты API:

```bash
fly secrets set -a nuska-etno S3_ENDPOINT='https://<ACCOUNT_ID>.r2.cloudflarestorage.com' S3_REGION=auto S3_BUCKET='nuska-images' S3_ACCESS_KEY_ID='…' S3_SECRET_ACCESS_KEY='…' S3_PUBLIC_URL='https://img.<домен>'
```

5. В Vercel: `NEXT_PUBLIC_IMAGES_HOST=img.<домен>` (только хост, без `https://`) → **Redeploy**.

Лимит одного фото — 4 МБ (ограничение тела запроса Vercel — 4.5 МБ). Форматы: JPEG, PNG, WebP.

## 7. Почта (подтверждение email, восстановление пароля)

**Resend** (https://resend.com): добавьте домен и DNS-записи, которые он покажет, создайте API-ключ.

```bash
fly secrets set -a nuska-etno SMTP_HOST=smtp.resend.com SMTP_PORT=465 SMTP_SECURE=true SMTP_USER=resend SMTP_PASSWORD='re_…' MAIL_FROM='NUSKA_etno <no-reply@<домен>>'
```

**Brevo** (альтернатива): `SMTP_HOST=smtp-relay.brevo.com SMTP_PORT=587 SMTP_SECURE=false`,
логин и SMTP-ключ из раздела *SMTP & API*.

## 8. Домен

1. Vercel → **Settings → Domains** → добавьте домен, пропишите DNS-записи у регистратора.
2. Обновите `NEXT_PUBLIC_SITE_URL` в Vercel (Redeploy) и `WEB_URL` в Fly.

## 9. Автоматический деплой

- **Vercel** пересобирает сайт при каждом push в `main` (и делает preview для pull request).
- **GitHub Actions:** `.github/workflows/ci.yml` — линтер, типы, unit- и e2e-тесты на PostgreSQL,
  сборки и Docker-образ API. `.github/workflows/deploy-api.yml` после зелёного CI на `main`
  деплоит API на Fly.io. Для этого добавьте в GitHub → **Settings → Secrets → Actions**
  секрет `FLY_API_TOKEN`:

```bash
fly tokens create deploy -a nuska-etno
```

## 10. После запуска — чек-лист

- [ ] Админка → **Точки самовывоза**: добавить реальную точку (адрес, часы, телефон).
- [ ] Админка → **Контент**: тексты `about`, `pickup`; проверить `contacts` и `stores`.
- [ ] Админка → **Товары**: фото, описания, состав, остатки (включить «Учитывать остаток»).
- [ ] Тестовый заказ от обычного пользователя → подтверждение в админке → уведомление.
- [ ] Восстановление пароля приходит на почту.
- [ ] `/sitemap.xml` и `/robots.txt` открываются с правильным доменом.
