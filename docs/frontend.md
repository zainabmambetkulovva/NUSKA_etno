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
| `/` | Home: hero (3D podium), why us, our prices, testimonials |
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

## Home page (brand brief, Nov 2026)

Order: header → hero with the 3D podium → "Why choose us?" → "Our prices" → customer
testimonials → footer. No pictures cut out of design mockups are used anywhere; product
pictures are the company's own photos or the ones uploaded in the admin panel.

- **Logo** (`components/brand/logo.tsx`): the gold knot of four lobes around a diamond,
  drawn as a vector (`LogoMark`), and the name in Lora.
- **Header** (`components/layout/header.tsx`): logo on the left, then the menu (Home ·
  About · Our prices · Contacts), KG/RU, and two separate buttons "Sign in" and "Register"
  (the personal account once signed in). The cart icon appears only when the cart is not
  empty. Transparent over the hero on the home page; burger menu below 1280 px.
- **Hero** (`components/home/hero.tsx`, `components/three/hero-podium-scene.tsx`): text and
  buttons on the left; on the right a real 3D composition (React Three Fiber): a carved
  wooden podium with Kyrgyz ornaments, a glass jar of honey with a dipper, navat crystals in
  a carved bowl, kymyz in a ceramic bowl, zhupka, kurut and sary may. Everything is one
  `THREE.Group` turning to the left (negative `rotation.y`, delta-time based, one turn per
  30 s, no jumps). Floating leaves, golden sun particles, soft reflections from in-scene
  light panels (no HDR download), contact shadows. Loaded lazily, rendered only while
  visible, lighter on phones, still with reduced motion, nothing without WebGL.
- **Why choose us?** (`components/home/why-us.tsx`): after the brand reference — deep green
  with the Tian Shan, six numbered promises (01–06) with gold line icons, each next to a
  floating photo of a company product, joined by thin gold curves.
- **Company product photos** (`public/images/products`, `lib/product-photos.ts`): cut from the
  photos the company sent and enlarged ×4 with an EDSR model. Until the admin uploads a photo
  for a product, navat, beshbarmak, kymyz, zhupka and sary may show these photos everywhere
  (catalog, product page, cart, gift builder, prices) — whole, on a blurred copy of themselves.
  An uploaded photo always wins.
- **Our prices** (`components/home/prices-section.tsx`): prices straight from the catalog.
  Product lines are grouped by name ("Нават 0.5/0.6/0.7" → "Нават" with three prices,
  "Керемет шыпаа — классика/чычырканак" → two prices). The richest line is shown large
  with floating price tags; the others as animated tiles with category tabs and "Add to
  cart". Photos float gently; a product without any photo shows the gold mark on a warm gradient.
- **Testimonials** (`components/home/testimonials.tsx`, `/reviews`): admin-managed
  (`/admin/testimonials`), endless carousel: the centre card is the largest with a gold
  glow, the neighbours turned in perspective, autoplay with pause on hover/focus, arrows,
  dots and swipe. Sample entries (`isDemo`) are labelled "Мисал / Пример" with a note.
- **Footer** (`components/layout/footer.tsx`): mountain landscape drawn as vectors with
  cream waves on top, deep green area with three columns (logo and slogan · menu ·
  four round gold social icons: Instagram, Telegram, WhatsApp, YouTube), bottom line with
  the copyright and the motto. Links come from the admin `contacts` block.

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

- Real product photos (upload them in the admin panel).
