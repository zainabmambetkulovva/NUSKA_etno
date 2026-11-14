# Запуск в интернет — только бесплатные сервисы

| Что | Где | Бесплатный тариф |
|---|---|---|
| Сайт (`apps/web`) | **Vercel** Hobby | бесплатно; см. примечание о коммерческом использовании ниже |
| API (`apps/api`) | **Render** Free | бесплатно, без карты; засыпает через 15 минут без запросов |
| База данных | **Neon** Free | 0.5 ГБ |
| Фото товаров | **Supabase** Storage | 1 ГБ, без карты |
| Письма | **Brevo** Free | 300 писем в день |
| «Будильник» для API | **cron-job.org** | бесплатно |

```text
Покупатель ──▶ Vercel (сайт) ──/api/* + секретный ключ──▶ Render (API) ──▶ Neon (база)
                                                              ├──▶ Supabase Storage (фото)
                                                              └──▶ Brevo (письма)
```

- Покупатель открывает только сайт. API напрямую из интернета закрыт: без секретного ключа
  отвечает `403`; открыт только `/api/health`.
- Секреты вписываются **только в панелях сервисов** — не в git и не в чат.
- Миграции базы API применяет сам при каждом запуске (`MIGRATE_ON_START=true`);
  если миграция не прошла, новая версия не запускается.

> **Vercel Hobby** по условиям Vercel предназначен для некоммерческих проектов. Для
> тестового запуска этого достаточно. Когда магазин начнёт продавать через сайт, нужен
> либо Vercel Pro (платный), либо перенос сайта на другой бесплатный хостинг (например,
> Netlify) — код для этого менять почти не придётся.

---

## Шаг 1. Neon — две строки подключения

1. https://console.neon.tech → ваш проект → кнопка **Connect**.
2. Включите **Connection pooling** → скопируйте строку → это **Строка А**.
   Допишите в конец: `&pgbouncer=true&connect_timeout=15`
3. Выключите **Connection pooling** → скопируйте строку → это **Строка Б**.

Сохраните обе строки в заметках. Никому не отправляйте.

## Шаг 2. Адрес сайта на Vercel

Vercel → ваш проект → вверху раздел **Domains**: адрес вида `https://….vercel.app`.
Это **Адрес сайта**.

## Шаг 3. Render — запустить API

1. https://render.com → **Get Started** → войдите через **GitHub**.
2. **New +** → **Blueprint** → выберите репозиторий `NUSKA_etno` → ветка `main`.
3. Render прочитает файл `render.yaml` и попросит заполнить три поля:

| Поле | Что вставить |
|---|---|
| `DATABASE_URL` | Строка А |
| `DIRECT_URL` | Строка Б |
| `WEB_URL` | Адрес сайта |

4. **Apply**. Сборка идёт 5–10 минут.
5. Когда сервис `nuska-etno-api` станет **Live**, вверху будет его адрес вида
   `https://nuska-etno-api.onrender.com` — это **Адрес API**.
   Откройте `Адрес API/api/health` → должно быть `"status":"healthy"`.
6. В сервисе → **Environment** → найдите `PROXY_SECRET` (Render создал его сам) →
   скопируйте значение — это **Ключ сайта** (нужен на шаге 6).

## Шаг 4. «Будильник», чтобы API не засыпал

1. https://cron-job.org → бесплатная регистрация → **Create cronjob**.
2. URL: `Адрес API/api/health`, расписание: **каждые 10 минут** → **Create**.

Без этого первый покупатель после перерыва ждёт около минуты.
Бесплатных часов Render (750 в месяц) хватает на работу без перерывов.

## Шаг 5. Наполнить базу (каталог, контакты, магазины, ваш аккаунт админа)

1. GitHub → репозиторий → **Settings** → **Secrets and variables** → **Actions** →
   **New repository secret** — три секрета:

| Name | Secret |
|---|---|
| `PRODUCTION_DATABASE_URL` | Строка Б |
| `ADMIN_EMAIL` | ваша почта для входа в админку |
| `ADMIN_PASSWORD` | пароль для админки: 12+ символов, буквы и цифры |

2. Вкладка **Actions** (верхнее меню репозитория) → слева **Initialize database** →
   справа **Run workflow** → зелёная кнопка **Run workflow**. Через 2–3 минуты — зелёная галочка.

Кнопку можно нажимать повторно: ничего не дублируется, правки из админки сохраняются.

## Шаг 6. Vercel — настроить сайт

1. Vercel → проект → **Settings** → **General** → **Root Directory**: `apps/web` → **Save**.
2. **Settings** → **Environment Variables**:

| Name | Value |
|---|---|
| `API_INTERNAL_URL` | Адрес API (без `/api` в конце) |
| `API_PROXY_SECRET` | Ключ сайта (шаг 3.6) |
| `NEXT_PUBLIC_SITE_URL` | Адрес сайта |

3. **Deployments** → у верхней строки **⋯** → **Redeploy**.

## Шаг 7. Проверить

1. Откройте Адрес сайта → главная на кыргызском с 3D-дасторконом и товарами.
2. **Кирүү** → почта и пароль из шага 5.
3. **Башкаруу** (админка) → **Алып кетүү жайлары** → добавьте реальную точку самовывоза
   (без неё заказ оформить нельзя).
4. Оформите тестовый заказ с другого аккаунта → подтвердите его в админке.

---

## Потом: фото товаров (Supabase Storage)

1. https://supabase.com → **New project** (регион Frankfurt) — он нужен только для хранения фото.
2. **Storage** → **New bucket** → имя `nuska-images` → включите **Public bucket**.
3. **Storage** → **Settings** → **S3 Connection** → **New access key**.
4. Render → сервис API → **Environment** → добавьте:

| Key | Value |
|---|---|
| `S3_ENDPOINT` | `https://<ref>.supabase.co/storage/v1/s3` (показан в S3 Connection) |
| `S3_REGION` | регион из S3 Connection, например `eu-central-1` |
| `S3_BUCKET` | `nuska-images` |
| `S3_ACCESS_KEY_ID` | Access key ID |
| `S3_SECRET_ACCESS_KEY` | Secret access key |
| `S3_FORCE_PATH_STYLE` | `true` |
| `S3_PUBLIC_URL` | `https://<ref>.supabase.co/storage/v1/object/public/nuska-images` |

5. Vercel → `NEXT_PUBLIC_IMAGES_HOST` = `<ref>.supabase.co` → **Redeploy**.

Фото до 4 МБ, форматы JPEG, PNG, WebP. Загрузка — в админке на странице товара.

## Потом: письма (Brevo)

Нужны для подтверждения почты и восстановления пароля.

1. https://www.brevo.com → регистрация → **Senders, Domains & Dedicated IPs** → добавьте и
   подтвердите адрес отправителя (можно обычную почту).
2. **SMTP & API** → **SMTP** → создайте SMTP-ключ.
3. Render → **Environment**:

| Key | Value |
|---|---|
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | логин со страницы SMTP |
| `SMTP_PASSWORD` | SMTP-ключ |
| `MAIL_FROM` | `NUSKA_etno <подтверждённый адрес>` |

## Потом: свой домен

Vercel → **Settings → Domains** → добавьте домен и DNS-записи у регистратора.
Затем обновите `NEXT_PUBLIC_SITE_URL` в Vercel и `WEB_URL` в Render.

## Как обновляется сайт

- Изменения попадают в `main` → **Vercel** пересобирает сайт, **Render** — API (сам применяет миграции).
- **GitHub Actions** (`.github/workflows/ci.yml`) на каждом pull request проверяет код:
  линтер, типы, тесты на PostgreSQL, сборки, Docker-образ API.
