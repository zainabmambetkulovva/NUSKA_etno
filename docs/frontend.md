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
| `/` | Home: hero, categories, popular products, about, advantages, dastorkon, pickup, reviews |
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

- Brand colours `brand` (#355B3E) and `cream` (#F4E9B9) in `tailwind.config.ts`.
- Fonts: Lora (headings) and Inter (text) with `cyrillic-ext` for Ң, Ө, Ү.
- Ornament: line version of «кочкор мүйүз» (`components/brand/ornament.tsx`) for dividers,
  backgrounds, the logo mark and the loader.
- Animations respect `prefers-reduced-motion`; product cards tilt only for mouse input.

## 3D scene (TZ §7)

`components/three/dastorkon-scene.tsx` (React Three Fiber + drei), wrapped by
`components/home/hero-scene.tsx`.

- **Content:** round dastorkon with a procedurally drawn kochkor-muyuz ornament,
  kattama on a wooden board, kymyz in a wooden bowl with a ladle, a glass jar of honey,
  navat crystals on a plate, sary may in a piyala, a stack of zhupka, a teapot and piyalas.
  All models and textures are generated in code (`procedural.ts`): no downloads.
- **Interaction:** the composition turns gently towards the cursor, the camera dollies in,
  items appear one by one and "breathe"; hovering lifts an item and shows its name,
  clicking opens the catalog search for it.
- **Performance:** the three.js chunk (~690 KB) loads lazily after the page is idle and
  never blocks the hero text; rendering stops when the hero is off screen or the tab is
  hidden (`frameloop="never"`); lite mode for phones / weak CPUs (fewer segments, no glass
  transmission, no shadow maps, capped pixel ratio); `prefers-reduced-motion` renders one
  static frame; environment lighting comes from in-scene light panels (no HDR files).
- **Fallback:** no WebGL, Save-Data, a lost WebGL context or any render error → the 2D
  composition (`hero-visual.tsx`).
- **Real models later:** when the company provides GLB/GLTF files (TZ §7.1), each
  procedural object can be swapped for `useGLTF` (compress with Draco/meshopt and KTX2 textures).

## Home page sections (master brief)

Order: Hero with the 3D dastorkon → categories → "Our products" → brand story with the
3D yurt scene (`components/three/yurt-scene.tsx`, loaded only near the viewport) →
benefits (animated line icons) → pickup (4 steps + points) → reviews (only real,
moderated ones; honest empty state) → FAQ (from the admin panel) → newsletter.

- **3D dastorkon:** hovering a product shows its name and current price from the API;
  clicking zooms the camera in and opens a card with "Add to cart" and a product link
  (Escape or a click outside closes it). Scene items map to catalog SKUs in
  `components/home/hero-scene.tsx` (`SCENE_SKUS`).
- **Header:** catalog mega menu (`components/layout/mega-menu.tsx`), favorites and cart
  counters, header background changes on scroll; full navigation from 1280 px, burger menu
  below.
- **Footer:** 5 columns (collapsible on phones), contacts and socials only from the
  admin `contacts` block (phone, whatsapp, email, address, hours, instagram, telegram,
  youtube), "back to top".
- **Pages:** `/faq` (search, categories, FAQPage structured data), `/traditions`, `/search`
  (suggestions, recent queries kept in this browser), `/checkout/success`,
  `/newsletter/confirm`, and `/privacy`, `/terms`, `/order-terms`, `/returns` whose text
  comes from the admin content blocks `page.*` — until then an honest "being prepared"
  notice is shown.
- **Fonts:** Cormorant Garamond and Manrope were checked for Kyrgyz letters: Manrope
  falls back for «ң», Cormorant uses a non-standard «л». Lora + Inter are kept.

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
- Parallax: `components/ui/parallax.tsx` (hero ornament, dastorkon section).
- The logo ornament in the header draws itself once on load.
- All of them are switched off with `prefers-reduced-motion`.

## Browser tests (Playwright)

`apps/web/e2e/*.spec.ts`, config `apps/web/playwright.config.ts`. They run on every PR in
GitHub Actions (job `e2e-web`) against a real API, website and PostgreSQL with demo data.

Covered: languages and switching, catalog/search/product page, the full order flow
(guest cart → login → checkout → admin confirms → customer notification), 3D scene and
packaging viewer with fallback without WebGL, mobile menu and no horizontal scroll.

Run locally (API and website already started, API with `NODE_ENV=test THROTTLE_DISABLED=true`):

```bash
pnpm --filter @nuska/web exec playwright install chromium
SEED_CUSTOMER_PASSWORD=... SEED_ADMIN_PASSWORD=... pnpm --filter @nuska/web test:e2e
```

Without the `SEED_*` passwords the order test is skipped.

## Not done yet

- Real product photos and the original logo (placeholders are shown).
