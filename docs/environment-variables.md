# Environment Variables

Backend variables are validated at startup (`apps/api/src/config/env.validation.ts`):
the API refuses to start with a missing `DATABASE_URL` or a `JWT_SECRET` shorter than 32 characters.
Template: `apps/api/.env.example`.

## Backend (`apps/api/.env`)

### Core

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development`, `production` or `test` |
| `PORT` | `4000` | HTTP port. All routes are under `/api` |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed frontend origins (credentials enabled) |
| `WEB_URL` | `http://localhost:3000` | Frontend URL used in e-mail links |
| `TRUST_PROXY` | `false` | `true` behind a reverse proxy, so rate limiting sees the real client IP |
| `SWAGGER_ENABLED` | `true` (dev), `false` (prod) | Swagger UI at `/api/docs` |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | – | Connection used by the app (required). On Neon use the **pooled** URL |
| `DIRECT_URL` | – | Direct (non-pooled) connection used by Prisma Migrate (required) |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | – | Signing secret, ≥ 32 characters (required, no default) |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime (`900`, `15m`, `1h`) |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | Session (refresh token) lifetime |
| `BCRYPT_ROUNDS` | `12` | bcrypt cost |
| `COOKIE_SECURE` | `true` in production | Send cookies over HTTPS only |
| `COOKIE_SAMESITE` | `lax` | `lax`, `strict` or `none`. Keep `lax` when the site and API share a domain (e.g. `nuska.kg` and `api.nuska.kg`). `none` requires `COOKIE_SECURE=true` and weakens CSRF protection |
| `COOKIE_DOMAIN` | – | Set to the parent domain (e.g. `.nuska.kg`) if the site and API are on different sub-domains |

### E-mail (SMTP)

Used for e-mail verification and password reset. Without `SMTP_HOST`, outside
production, messages (with links) are printed to the API log.

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | – | SMTP server |
| `SMTP_PORT` | `587` | Port |
| `SMTP_SECURE` | `false` | `true` for implicit TLS (port 465) |
| `SMTP_USER` / `SMTP_PASSWORD` | – | Credentials |
| `MAIL_FROM` | `NUSKA_etno <no-reply@localhost>` | Sender |

### File storage (S3-compatible)

Without these, image upload endpoints answer `503 STORAGE_NOT_CONFIGURED`.

| Variable | Default | Description |
|----------|---------|-------------|
| `S3_ENDPOINT` | – | Custom endpoint for R2 / MinIO (empty for AWS) |
| `S3_REGION` | `auto` | Region |
| `S3_BUCKET` | – | Bucket name |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | – | Credentials |
| `S3_PUBLIC_URL` | – | Public base URL of the bucket / CDN; stored image URLs start with it |
| `S3_FORCE_PATH_STYLE` | `false` | `true` for MinIO |

### Seed (development only)

| Variable | Default | Description |
|----------|---------|-------------|
| `SEED_ADMIN_EMAIL` | `admin@example.com` | Demo admin e-mail |
| `SEED_ADMIN_PASSWORD` | random | Demo admin password; generated and printed once if empty |
| `SEED_CUSTOMER_EMAIL` | `customer@example.com` | Demo customer e-mail |
| `SEED_CUSTOMER_PASSWORD` | random | Demo customer password; generated and printed once if empty |

### Tests

| Variable | Default | Description |
|----------|---------|-------------|
| `TEST_DATABASE_URL` | – | Dedicated database for `pnpm --filter @nuska/api test:e2e`. **It is wiped by the tests**; its name must contain `test` |

## Frontend (`apps/web/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend URL (without `/api`) |

## Security guidelines

1. Never commit `.env` files — only `.env.example`.
2. Use a random `JWT_SECRET` (`openssl rand -base64 48`); changing it signs everyone out.
3. Restrict `CORS_ORIGINS` to the production domain.
4. Use `sslmode=require` for Neon.
