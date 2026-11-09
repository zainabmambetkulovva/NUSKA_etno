# Frontend (apps/web)

Next.js 15 (App Router), React 19, Tailwind CSS, TanStack Query, Zustand,
React Hook Form + Zod, Framer Motion.

## Routing and languages

- Every page lives under `/ky/...` (default) or `/ru/...`; `/` redirects to the saved
  language (cookie `NEXT_LOCALE`) or Kyrgyz. For signed-in users the choice is also stored in the profile.
- Interface texts: `src/i18n/dictionaries/ky.ts` (source) and `ru.ts` (same shape, type-checked).
  **Kyrgyz texts must be reviewed by an editor.**
- Dates are formatted by hand for Kyrgyz (browsers have no Kyrgyz month names) and always in the
  shop time zone `Asia/Bishkek`.

| Path | Page |
|---|---|
| `/` | Home: hero, our products, why us, our story, reviews, gift sets + newsletter |
| `/catalog`, `/catalog/[category]` | Catalog: search, category (with sub-categories), sort, in-stock filter, pagination |
| `/product/[slug]` | Product page, JSON-LD, reviews, related products |
| `/cart`, `/checkout` | Cart (guest cart in localStorage, merged on login), checkout (signed-in only) |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | Auth |
| `/account/...` | Profile, orders (cancel, repeat, reviews), favorites, notifications, settings |
| `/about`, `/pickup`, `/contacts` | Text from admin content blocks `about`, `pickup`, `contacts` |
| `/admin/...` | Admin panel (role ADMIN; the API enforces it) |

## Data

- Public pages are server-rendered on request; API responses are cached for 60 s
  (`src/lib/api/server.ts`). The build does not need a running API.
- Client components call the API through `src/lib/api/client.ts` (same-origin `/api`,
  httpOnly cookies, one automatic session refresh on 401). `/api/*` is served by the proxy
  route `src/app/api/[...path]/route.ts`, which adds the shared secret and the visitor IP.
- API errors carry a `code`; messages come from `t.errors[code]`.

## Design system

- Brand colours `brand` (#355B3E) and `cream` (#F4E9B9), plus the rich palette of the
  home design: `forest` (deep green), `honey` (gold), `sand` (warm cream), `wood`, `ruby`
  (`tailwind.config.ts`); gold buttons `.btn-gold`, outline `.btn-outline-dark`.
- Fonts: Lora (headings), Inter (text) and Caveat (handwritten accent), all with
  `cyrillic-ext` for Ң, Ө, Ү.
- Logo: the company's gold medallion `public/images/logo.webp` (taken unchanged from the
  design the company sent) with the name in Lora (`components/brand/logo.tsx`).
- Ornament: «кочкор мүйүз» (`components/brand/ornament.tsx`) and the decor of the design
  (`components/brand/kyrgyz-decor.tsx`): gold corner ornaments, section waves, swaying
  leaves, mountain line art and silhouettes, the ram's horn band of the footer.
- Animations respect `prefers-reduced-motion`; product cards tilt only for mouse input.

## Home page (design sent by the company, Nov 2026)

Order: hero → "Our products" → "Why choose us?" → "Our story" → reviews → gift sets and
the newsletter → footer. Nothing else is put on the home page (FAQ, pickup and the stores
have their own pages).

- **Header** (`components/layout/header.tsx`): deep green bar with the gold medallion,
  Home · Catalog ▾ (mega menu) · About · Pickup · Reviews · Contacts, KG RU, search, ♡,
  cart and "Sign in / Register" (the personal account once signed in). On the home page it
  lies transparent over the hero until the page is scrolled. Burger menu below 1280 px.
- **Hero** (`components/home/hero.tsx`): the dastorkon photo `public/images/home/hero.webp`
  on the right, the deep green panel with the name, slogan, "Go to the catalog" and
  "Make a gift" on the left; on phones the photo is on top and the text below it.
- **Our products:** six signature products (sary may, zhupka, beshbarmak, kymyz, navat,
  kurut) with their photos `public/images/home/product-*.webp`. A card opens the product
  (matched by slug, e.g. `navat` → `navat-0-5`) with its price, otherwise the search.
- **Signature photos as fallback** (`lib/product-photos.ts`): until the admin uploads a
  product photo, these products show the photo from the design everywhere (catalog,
  product page, cart, gift builder). An uploaded photo always wins.
- **Why us / story / reviews / gifts:** gold line icons on deep green, the story photo
  with the handwritten "With love from Kyrgyzstan", only real moderated reviews (honest
  empty state), gift sets with the 3D builder and the newsletter (consent required).
- **Footer** (`components/layout/footer.tsx`): deep green with mountains and the ram's
  horn band; navigation, contacts with the wholesale/retail order links, the Telegram
  catalog and socials, language switch. Contacts and links come only from the admin
  `contacts` block.
- **3D:** the product packaging viewer and the gift box of the builder
  (`components/three/*`); the home page has no 3D scene any more.

- **Pages:** `/faq` (search, categories, FAQPage structured data), `/traditions`, `/search`
  (suggestions, recent queries kept in this browser), `/checkout/success`,
  `/newsletter/confirm`, and `/privacy`, `/terms`, `/order-terms`, `/returns` whose text
  comes from the admin content blocks `page.*` — until then an honest "being prepared"
  notice is shown.
- **Fonts:** Cormorant Garamond and Manrope were checked for Kyrgyz letters: Manrope
  falls back for «ң», Cormorant uses a non-standard «л». Lora + Inter are kept.

## NUSKA AI (`components/ai`, `/assistant`)

- Floating widget on every page except `/assistant` and the admin panel; full page
  `/assistant?q=...` with the 3D symbol (`components/three/ai-orb-scene.tsx`, SVG orb fallback).
- The chat shows the mode honestly ("AI not connected — answering from the catalog").
- Proposals: "Add to cart" (shared `hooks/use-add-set.ts`) or "Open in the builder".
- History is kept in `sessionStorage` for the tab; the last 12 messages and the current cart
  are sent with each question.
- Admin: `/admin/ai` — on/off, provider status, model, calls today.

## Gift set builder (`/gift-builder`, TZ section 08)

`components/gift/gift-builder.tsx` + `components/three/gift-box-scene.tsx`.

- The draft (product ids and quantities only) is kept in this browser
  (`stores/gift-set.ts`); names, prices, availability and the total come from
  `POST /api/gift-sets/quote` on every change.
- The 3D box shows each chosen product as a small model of its packaging (up to 3 copies
  per product, 15 models); drag to rotate. Without WebGL — a 2D box with labels.
- "Add the set to the cart": guests — browser cart; signed-in users — `POST /api/cart/merge`
  (quantities capped by stock; skipped products are reported).
- "Save the set": signed-in users — in the account (`/api/gift-sets`, up to 20);
  guests — in this browser.

## 3D packaging on the product page (TZ §6.4)

`components/three/packaging-viewer.tsx`, shown by `components/product/product-gallery.tsx`.

- The admin chooses a model per product (field "3D packaging"): bottle (kymyz), jar
  (sary may), box (navat), pack (beshbarmak noodles) or none. Stored in
  `products.packaging_3d`.
- The label is drawn in code with the product name in the current language.
- Drag to rotate; slow auto-rotation unless the user prefers reduced motion.
- The buttons "Photo / 3D" appear only when a model is chosen and WebGL works; the 3D chunk
  loads only when the user opens it.

## Animations

- Page transitions: `app/[locale]/template.tsx` (fade + slide, framer-motion).
- "Fly to cart": `lib/fly-to-cart.ts` — the product image flies to the cart icon
  (`[data-cart-target]`) after adding.
- Hero photo slowly zooms in (Ken Burns), leaves sway, sections appear on scroll (`Reveal`),
  product cards lift on hover.
- All of them are switched off with `prefers-reduced-motion`.

## Browser tests (Playwright)

`apps/web/e2e/*.spec.ts`, config `apps/web/playwright.config.ts`. They run on every PR in
GitHub Actions (job `e2e-web`) against a real API, website and PostgreSQL with demo data.

Covered: languages and switching, header and home sections of the design, catalog/search/
product page, the full order flow (guest cart → login → checkout → admin confirms →
customer notification), packaging viewer with fallback without WebGL, mobile menu and no
horizontal scroll.

Run locally (API and website already started, API with `NODE_ENV=test THROTTLE_DISABLED=true`):

```bash
pnpm --filter @nuska/web exec playwright install chromium
SEED_CUSTOMER_PASSWORD=... SEED_ADMIN_PASSWORD=... pnpm --filter @nuska/web test:e2e
```

Without the `SEED_*` passwords the order test is skipped.

## Not done yet

- Real product photos (the signature products use the photos of the design until then).
