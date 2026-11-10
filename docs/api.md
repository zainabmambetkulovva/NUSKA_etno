# API overview

Base URL: `http://localhost:4000/api`. Interactive docs (Swagger): `/api/docs` (disabled in production by default).

## Conventions

- **Money** — integers in tyiyn: `{ "amount": 23500, "currency": "KGS" }` = 235 som.
- **Language** — `?locale=ru|ky`, or the `X-Locale` header, or `Accept-Language`; default `ru`.
  Product and category names, notifications and e-mails follow it.
- **Lists** — `?limit=` (1–100, default 20) and `?offset=`; response `{ data: [...], meta: { total, limit, offset } }`.
- **Errors** — `{ statusCode, code, message, ...details }`. `code` is stable and meant for
  localised messages on the frontend (e.g. `INVALID_CREDENTIALS`, `INSUFFICIENT_STOCK`).
  Validation errors: `422 { code: "VALIDATION_FAILED", errors: [{ field, messages }] }`.
  Unknown fields in a request body are rejected (protection against mass assignment).

## Authentication

Session-based, tokens are in **httpOnly cookies** (JavaScript cannot read them):

| Cookie | Lifetime | Sent to |
|---|---|---|
| `nuska_access` | 15 min (JWT) | all routes |
| `nuska_refresh` | 30 days (opaque, stored hashed in `sessions`) | `/api/auth/*` only |

Frontend flow: send requests with `credentials: 'include'`. On `401` call
`POST /api/auth/refresh` once and retry; if refresh also returns `401`, the user is signed out.
The refresh token is rotated on every use; a reused token is rejected.
Session, user status and role are checked on every request, so logout, blocking and role
changes take effect immediately.

All routes require authentication unless listed as public below. Admin routes require role `ADMIN`.

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/auth/register` | public | `{ email, password, firstName, lastName?, phone?, locale? }`; sends a verification e-mail |
| POST | `/auth/login` | public | `{ email, password }` |
| POST | `/auth/refresh` | public (refresh cookie) | rotates tokens |
| POST | `/auth/logout` | public (refresh cookie) | ends the current session |
| POST | `/auth/password/forgot` | public | always `204` (does not reveal registered e-mails) |
| POST | `/auth/password/reset` | public | `{ token, password }`; ends all sessions |
| POST | `/auth/email/verify` | public | `{ token }` |
| POST | `/auth/email/resend` | user | |
| GET | `/auth/session` | public | always `200 { user \| null }`; renews an expired access token from the refresh cookie (used by the frontend instead of `/users/me`) |

Rate limits: 100 requests/min per IP overall; 5/min for login, register and password endpoints.

## Customer

| Method | Path | Notes |
|---|---|---|
| GET / PATCH | `/users/me` | profile: `firstName`, `lastName`, `phone`, `locale` |
| POST | `/users/me/password` | `{ currentPassword, password }`; other sessions are ended |
| GET | `/cart` | items with `issue` (`UNAVAILABLE` / `INSUFFICIENT_STOCK`), `subtotal`, `canCheckout` |
| POST | `/cart/items` | `{ productId, quantity }` (adds) |
| PATCH / DELETE | `/cart/items/:productId` | set quantity / remove |
| DELETE | `/cart` | clear |
| POST | `/cart/merge` | `{ items: [{ productId, quantity }] }` — guest cart after login |
| POST | `/orders` | `{ pickupLocationId, customerName, customerPhone, customerEmail?, pickupTime?, customerComment? }` — items come from the server cart |
| GET | `/orders`, `/orders/:id` | own orders only |
| POST | `/orders/:id/cancel` | only while `PENDING` |
| POST | `/orders/:id/repeat` | puts available products back into the cart |
| GET | `/favorites`, `/favorites/ids` | |
| PUT / DELETE | `/favorites/:productId` | idempotent |
| POST | `/reviews` | `{ orderItemId, rating 1–5, comment? }` — completed orders only, once per item |
| GET | `/reviews/mine` | |
| GET | `/notifications?unread=true` | includes `unreadCount` |
| PATCH | `/notifications/:id/read`; POST `/notifications/read-all`; DELETE `/notifications/:id` | |

## Public catalog

| Method | Path | Notes |
|---|---|---|
| GET | `/products` | `search`, `category` (slug, includes sub-categories), `sort` = `default \| price_asc \| price_desc \| popular \| newest`, `inStock`, `featured` |
| GET | `/products/:slug` | details, images, characteristics, units, rating |
| GET | `/products/:slug/related` | |
| GET | `/products/:slug/reviews` | approved reviews |
| GET | `/reviews/latest?limit=6` | latest approved reviews across the catalog (home page) |
| GET | `/categories`, `/categories/:slug` | tree with product counts |
| GET | `/pickup-locations` | active points |
| GET | `/content/banners`, `/content/:key` | home page banners and text blocks |
| GET | `/health` | includes a database check |

## Admin (`/admin/...`, role ADMIN)

| Area | Endpoints |
|---|---|
| Dashboard | `GET /admin/dashboard?days=30` — orders by status, revenue (completed orders), popular products, low stock, new orders, sales by day |
| Products | `GET/POST /admin/products`, `GET/PATCH/DELETE /admin/products/:id` (delete = soft delete), `POST /:id/stock` (`IN` / `ADJUSTMENT`), `GET /:id/stock-movements`, `POST /:id/images` (multipart `file`), `PATCH/DELETE /:id/images/:imageId` |
| Categories | `GET/POST /admin/categories`, `GET/PATCH/DELETE /admin/categories/:id` |
| Orders | `GET /admin/orders` (`status`, `search`, `from`, `to`), `GET /admin/orders/:id` (history, `allowedTransitions`), `PATCH /admin/orders/:id/status` `{ status, comment? }` |
| Users | `GET /admin/users`, `GET /admin/users/:id` (with orders), `PATCH /admin/users/:id` `{ role?, isActive? }` |
| Reviews | `GET /admin/reviews?status=`, `PATCH /admin/reviews/:id` `{ status: APPROVED \| REJECTED }` |
| Pickup points | `GET/POST /admin/pickup-locations`, `PATCH /admin/pickup-locations/:id` (deactivate with `isActive: false`) |
| Content | `GET/POST /admin/content/banners`, `PATCH/DELETE /admin/content/banners/:id`, `GET /admin/content/blocks`, `PUT /admin/content/blocks/:key` |
| Uploads | `POST /admin/uploads/image?folder=categories\|banners\|content` |
| Payments | `GET /admin/payments` |
| Audit | `GET /admin/audit-logs?entityType=&entityId=` |

## Business rules

- **Order statuses**: `PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP → COMPLETED`;
  any non-final status can go to `CANCELLED`. Customers may cancel only `PENDING` orders.
  Every change is stored in the status history, creates a notification and (for admins) an audit record.
- **Stock**: deducted when the order is created, returned when it is cancelled
  (see [database-notes.md](database-notes.md)). Concurrent orders cannot oversell.
- **Publishing**: an `ACTIVE` product, category or banner must have both `ru` and `ky` translations.
- **Payments**: no provider is connected yet, so there is no online payment and no webhook
  endpoint. `PaymentsService.processProviderEvent` is ready for a provider adapter: it is
  idempotent per `(provider, externalEventId)` and only applies allowed status transitions.

## FAQ and newsletter

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/faq?search=&category=` | public | active questions in the request language |
| GET/POST | `/api/admin/faq` | ADMIN | list / create (both languages required when active) |
| PATCH/DELETE | `/api/admin/faq/:id` | ADMIN | audit log `faq.*` |
| POST | `/api/newsletter/subscribe` | public, 5/min | `{ email, consent: true, locale }`, always `{ ok: true }` (no account enumeration); double opt-in e-mail, resent at most every 10 min |
| POST | `/api/newsletter/confirm` | public, 5/min | `{ token }` from the e-mail (valid 7 days) |
| GET | `/api/admin/newsletter?status=` | ADMIN | paginated |
| GET | `/api/admin/newsletter/export` | ADMIN | CSV of confirmed subscribers |
| POST | `/api/admin/newsletter/:id/unsubscribe` | ADMIN | audit log `newsletter.unsubscribe` |

Without SMTP no e-mail is sent: subscribers stay "pending" in the admin panel.

## Testimonials

Customer testimonials of the home page carousel. They are separate from product reviews
(which need a delivered order) and are managed by the admin.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/testimonials` | Public: published ones, ordered by `sortOrder`, then newest date |
| GET | `/admin/testimonials` | Admin: all, with `isPublished`, `sortOrder` |
| POST | `/admin/testimonials` | `authorName`, `text`, `rating` 1–5, `reviewDate` (YYYY-MM-DD), optional `photoUrl`, `avatarUrl` (https), `productName`, `instagramUrl` (instagram.com), `isPublished`, `isDemo`, `sortOrder` |
| PATCH | `/admin/testimonials/:id` | Same fields, all optional; `null` clears a picture or link |
| DELETE | `/admin/testimonials/:id` | 204 |

Photos are uploaded with `POST /admin/uploads/image?folder=testimonials`. The migration
`20261109090000_testimonials` adds six sample testimonials with `isDemo = true`; the site
labels them as samples until the admin replaces them. Every change is in the audit log.

## Gift sets

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/api/gift-sets/quote` | public | `{ items: [{ productId, quantity }] }` (≤ 30 lines) → lines priced from the catalog, `unavailable`, `total`, `canOrder` |
| GET | `/api/gift-sets` | user | own saved sets, priced now |
| POST | `/api/gift-sets` | user | `{ name, items }`, at most 20 sets (`GIFT_SET_LIMIT`) |
| DELETE | `/api/gift-sets/:id` | user | own sets only |

## NUSKA AI

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/ai/status` | public | `{ enabled, mode: "ai" \| "catalog" }` |
| POST | `/api/ai/chat` | public, 10/min | `{ locale, messages: [{ role, content ≤ 1000 }] (≤ 12, last = user), cart? }` → `{ mode, reply, products, proposal, suggestions }` |
| GET/PUT | `/api/admin/ai/settings` | ADMIN | turn the assistant on/off (audit `ai.settings`); shows whether a key is configured, model, usage |

Module `apps/api/src/ai`: `ai.service.ts` (mode selection, daily cap, fallback),
`providers/` (`AiProvider` interface, `AnthropicProvider` — Claude with strict catalog tools,
cached system prompt, `fallbacks: "default"`), `tools/catalog-tools.service.ts` (search, details,
set building, pricing, pickup — database only), `catalog-assistant.ts` (no-model mode),
`prompts/system-prompt.ts`.

Rules: facts only from tools; the assistant never changes the cart, orders, payments or
accounts — `proposal` is shown with an "Add to cart" button the customer presses.
Conversations are not stored on the server (the browser keeps them for the tab).

## Catalog query (update)

`GET /api/products` also accepts `minPrice` / `maxPrice` (whole som), `sort=name`
(by the name in the request language), and `search` now matches the name, short
description and description in any language.

## Sign in with Google

| Method | Path | Notes |
|---|---|---|
| GET | `/api/auth/providers` | `{ google: boolean }` |
| GET | `/api/auth/google?locale=&next=` | redirect to Google (state + PKCE in an httpOnly cookie, 10 min) |
| GET | `/api/auth/google/callback` | verifies the ID token (audience, issuer, expiry, verified e-mail), finds the user by Google id or e-mail (links) or creates one without a password, sets the session cookies and redirects to `next` (only `/ky/...` or `/ru/...`); errors → `/{locale}/login?error=google` |
