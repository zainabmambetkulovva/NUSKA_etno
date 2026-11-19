# Environment Variables

Backend variables are validated at startup (`apps/api/src/config/env.validation.ts`):
the API refuses to start with a missing `DATABASE_URL` or a `JWT_SECRET` shorter than 32 characters.
Template: `apps/api/.env.example`.

## Backend (`apps/api/.env`)

### Core

| Variable           | Default                      | Description                                                                                                                                                                   |
| ------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`         | `development`                | `development`, `production` or `test`                                                                                                                                         |
| `PORT`             | `4000`                       | HTTP port. All routes are under `/api`                                                                                                                                        |
| `CORS_ORIGINS`     | `http://localhost:3000`      | Comma-separated allowed frontend origins (credentials enabled)                                                                                                                |
| `WEB_URL`          | `http://localhost:3000`      | Frontend URL used in e-mail links                                                                                                                                             |
| `TRUST_PROXY`      | `false`                      | `true` behind a reverse proxy, so rate limiting sees the real client IP                                                                                                       |
| `SWAGGER_ENABLED`  | `true` (dev), `false` (prod) | Swagger UI at `/api/docs`                                                                                                                                                     |
| `MIGRATE_ON_START` | `false`                      | `true`: the Docker image applies pending migrations before starting (Render free plan); if they fail the API does not start                                                   |
| `PROXY_SECRET`     | –                            | ≥ 32 chars, **required in production**. Requests without the matching `X-Proxy-Secret` header are refused (except `/api/health`); the visitor IP comes from the website proxy |

### Database

| Variable       | Default | Description                                                           |
| -------------- | ------- | --------------------------------------------------------------------- |
| `DATABASE_URL` | –       | Connection used by the app (required). On Neon use the **pooled** URL |
| `DIRECT_URL`   | –       | Direct (non-pooled) connection used by Prisma Migrate (required)      |

### Authentication

| Variable                 | Default              | Description                                                                                                                                                                       |
| ------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`             | –                    | Signing secret, ≥ 32 characters (required, no default)                                                                                                                            |
| `JWT_EXPIRES_IN`         | `15m`                | Access token lifetime (`900`, `15m`, `1h`)                                                                                                                                        |
| `REFRESH_TOKEN_TTL_DAYS` | `30`                 | Session (refresh token) lifetime                                                                                                                                                  |
| `BCRYPT_ROUNDS`          | `12`                 | bcrypt cost                                                                                                                                                                       |
| `COOKIE_SECURE`          | `true` in production | Send cookies over HTTPS only                                                                                                                                                      |
| `COOKIE_SAMESITE`        | `lax`                | `lax`, `strict` or `none`. Keep `lax` when the site and API share a domain (e.g. `nuska.kg` and `api.nuska.kg`). `none` requires `COOKIE_SECURE=true` and weakens CSRF protection |
| `COOKIE_DOMAIN`          | –                    | Set to the parent domain (e.g. `.nuska.kg`) if the site and API are on different sub-domains                                                                                      |

### E-mail (Resend or SMTP)

Used for e-mail verification, password reset and the newsletter confirmation. The API uses
**Resend** (HTTPS) when `RESEND_API_KEY` is set — recommended on Render, whose free plan
blocks outgoing SMTP ports; otherwise SMTP when `SMTP_HOST` is set. Without either, outside
production, messages (with links) are printed to the API log.

| Variable         | Default                           | Description                                                                                                |
| ---------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY` | –                                 | Resend API key (resend.com → API Keys) — **secret**, only in Render                                        |
| `MAIL_FROM`      | `NUSKA_etno <no-reply@localhost>` | Sender, e.g. `NUSKA_etno <no-reply@your-domain>`; the domain must be verified in Resend (SPF/DKIM records) |

Resend setup: create an account → **Domains → Add domain** → add the DNS records it shows at
your domain registrar → wait for «Verified» → **API Keys → Create** → put the key in Render as
`RESEND_API_KEY` and set `MAIL_FROM` with that domain → redeploy the API. Without a verified
domain Resend only delivers to the account owner's own address.

SMTP (alternative):

| Variable                      | Default                           | Description                        |
| ----------------------------- | --------------------------------- | ---------------------------------- |
| `SMTP_HOST`                   | –                                 | SMTP server                        |
| `SMTP_PORT`                   | `587`                             | Port                               |
| `SMTP_SECURE`                 | `false`                           | `true` for implicit TLS (port 465) |
| `SMTP_USER` / `SMTP_PASSWORD` | –                                 | Credentials                        |
| `MAIL_FROM`                   | `NUSKA_etno <no-reply@localhost>` | Sender                             |

### File storage (S3-compatible)

Without these, image upload endpoints answer `503 STORAGE_NOT_CONFIGURED`.

| Variable                                    | Default | Description                                                          |
| ------------------------------------------- | ------- | -------------------------------------------------------------------- |
| `S3_ENDPOINT`                               | –       | Custom endpoint for Supabase Storage / R2 / MinIO (empty for AWS)    |
| `S3_REGION`                                 | `auto`  | Region                                                               |
| `S3_BUCKET`                                 | –       | Bucket name                                                          |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | –       | Credentials                                                          |
| `S3_PUBLIC_URL`                             | –       | Public base URL of the bucket / CDN; stored image URLs start with it |
| `S3_FORCE_PATH_STYLE`                       | `false` | `true` for Supabase Storage and MinIO                                |

### Seed (development only)

| Variable                 | Default                                   | Description                                                                   |
| ------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `SEED_DEMO`              | `true` (`false` if `NODE_ENV=production`) | `false`: only catalog and site content, no demo pickup point, users or orders |
| `SEED_ADMIN_EMAIL`       | `admin@example.com`                       | Demo admin e-mail                                                             |
| `SEED_ADMIN_PASSWORD`    | random                                    | Demo admin password; generated and printed once if empty                      |
| `SEED_CUSTOMER_EMAIL`    | `customer@example.com`                    | Demo customer e-mail                                                          |
| `SEED_CUSTOMER_PASSWORD` | random                                    | Demo customer password; generated and printed once if empty                   |

### Tests

| Variable            | Default | Description                                                                                                            |
| ------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `TEST_DATABASE_URL` | –       | Dedicated database for `pnpm --filter @nuska/api test:e2e`. **It is wiped by the tests**; its name must contain `test` |

## Frontend (`apps/web/.env.local`)

The browser never calls the API directly: Next.js proxies `/api/*` to the API
(same origin, first-party httpOnly cookies, no CORS). Template: `apps/web/.env.example`.

| Variable                  | Default                                             | Description                                                                        |
| ------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `API_INTERNAL_URL`        | `http://localhost:4000`                             | Where the Next.js server reaches the API (proxy and server rendering)              |
| `API_PROXY_SECRET`        | –                                                   | Same value as `PROXY_SECRET` of the API; required in production                    |
| `NEXT_PUBLIC_SITE_URL`    | Vercel production URL, else `http://localhost:3000` | Public site URL for canonical links, hreflang, sitemap, link previews (Open Graph) |
| `NEXT_PUBLIC_IMAGES_HOST` | –                                                   | Exact host of the S3/CDN bucket with product images (enables image optimisation)   |

> The browser calls `/api/*` on the website; `src/app/api/[...path]/route.ts` forwards the
> request to the API with `X-Proxy-Secret` and `X-Client-IP` (the visitor IP from
> `X-Forwarded-For`, which Vercel sets). Rate limits therefore apply per visitor, and the API
> is not usable directly. See [deployment.md](deployment.md).

## Security guidelines

1. Never commit `.env` files — only `.env.example`.
2. Use a random `JWT_SECRET` (`openssl rand -base64 48`); changing it signs everyone out.
3. Restrict `CORS_ORIGINS` to the production domain.
4. Use `sslmode=require` for Neon.

### NUSKA AI (optional)

Without `ANTHROPIC_API_KEY` the assistant answers in **catalog mode** (built-in
keyword assistant over the catalog, no language model) and says so in the chat.
Add the key in Render → `nuska-etno-api` → Environment (never in Vercel, never in Git).

| Variable            | Default           | Purpose                                                                 |
| ------------------- | ----------------- | ----------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | –                 | Anthropic API key (paid, console.anthropic.com)                         |
| `AI_MODEL`          | `claude-opus-5-5` | Claude model, e.g. `claude-haiku-5-5` for lower cost                    |
| `AI_EFFORT`         | `low`             | `low` / `medium` / `high` / `xhigh` / `max`                             |
| `AI_DAILY_LIMIT`    | `300`             | Model calls per day per API instance; above it the catalog mode answers |

### Sign in with Google (optional)

Set in **Render → nuska-etno-api → Environment** (never in Git, never in Vercel):

| Variable               | Purpose                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`     | OAuth client ID (Google Cloud Console → APIs & Services → Credentials) |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret — **secret**, only in Render                       |
| `GOOGLE_REDIRECT_URI`  | optional; default `${WEB_URL}/api/auth/google/callback`                |

In Google Cloud Console add the redirect URI `https://<your-site>/api/auth/google/callback`
(the address of the website, the request goes through the website to the API) and the site
under "Authorized JavaScript origins". `WEB_URL` in Render must be the website address.
Without these variables the "Continue with Google" button is not shown.

Step by step (Google Cloud Console):

1. console.cloud.google.com → create a project «NUSKA_etno».
2. **APIs & Services → OAuth consent screen**: External; app name NUSKA_etno; support e-mail;
   scopes `openid`, `email`, `profile`; publish the app (otherwise only test users can sign in).
3. **Credentials → Create credentials → OAuth client ID → Web application**.
   - Authorized JavaScript origins: `https://<site>` (and `http://localhost:3000` for development).
   - Authorized redirect URIs: `https://<site>/api/auth/google/callback`
     (and `http://localhost:3000/api/auth/google/callback`).
4. Copy the client ID and secret into Render (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`),
   check `WEB_URL` = `https://<site>`, redeploy the API. The button appears by itself.

Account linking: signing in with Google finds the account by Google id, or by the same e-mail
(Google confirms the e-mail, so the account is linked and marked verified). A new Google account
records the acceptance of the terms (the notice is shown under the button).

## Online payment — Finik (API, Render)

The payment is created and confirmed by the **API**, so the keys go to
**Render → nuska-etno-api → Environment** (not to Vercel: the website never
sees them).

| Variable              | Value                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `FINIK_API_KEY`       | `x-api-key` from the Finik merchant account — **secret**                                                |
| `FINIK_ACCOUNT_ID`    | the Finik account that receives the money                                                               |
| `FINIK_PRIVATE_KEY`   | the RSA private key whose public key was sent to Finik (PEM; one line with `\n` works) — **secret**     |
| `FINIK_ENV`           | `production` (default) or `beta` (Finik's test environment)                                             |
| `FINIK_MERCHANT_NAME` | optional; name on the payment page (default `NUSKA_etno`)                                               |
| `FINIK_CARD_TYPE`     | optional; default `FINIK_QR`                                                                            |
| `FINIK_WEBHOOK_URL`   | optional; default `${WEB_URL}/api/payments/finik/webhook`                                               |
| `FINIK_PUBLIC_KEY`    | optional; Finik's webhook key if Finik changes it (the published production and beta keys are built in) |

How it works: checkout with «Онлайн-оплата» creates the order and a pending
payment, the API signs a request to Finik (`POST /v1/payment`, RSA-SHA256 as in
Finik's `@mancho.devs/authorizer`) and the customer goes to Finik's payment
page. Finik calls the webhook; the API checks Finik's signature and that the
money went to `FINIK_ACCOUNT_ID`, then marks the payment paid (once, even if
Finik resends). The checkout offers online payment only when these variables
are set (`GET /api/payments/methods`).
