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
| `/` | Home: hero, why us, our prices, about us, our products, closing call |
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

## Home page (the company's full-page design, Nov 2026)

The home page follows the full-page design the company sent, top to bottom:
header → hero → "Why choose us?" → "Our prices" (podium) → about us → "Our products" →
promises → closing call → footer. Sections live in `components/home/hero.tsx` and
`components/home/sections.tsx`.

- **Pictures** (`public/images/home`): the scenes of that design (hero, podium, meadow
  photo, closing landscape, wooden podium). They were cut out of the 726 px wide
  design picture, the baked-in texts, buttons and prices were removed (inpainting) and the
  result was enlarged ×4 with an EDSR model, so they are a little soft. Replace a file with
  a full-resolution picture of the same proportions to sharpen it; no code change is needed.
- **Header** (`components/layout/header.tsx`): unchanged — logo, menu (Home · About · Our
  prices · Contacts), KG/RU, separate "Sign in" and "Register" buttons, cart icon only when
  the cart is not empty. Transparent over the hero.
- **Hero:** the scene fills the screen (slow zoom), the slogan in two lines (cream and
  gold), the text and the "Go to the catalog" button on its dark left side; on phones the
  scene is on top and the text below. A cream wave with the gold knot closes it.
- **Why choose us?:** title on cream, four deep green cards with gold icons.
- **Our prices** (`PricesPodium`): the wooden podium of the design (`podium-base.webp`, the
  drawn products removed) with the company's own product photos standing on its blocks and a
  plate under each. The photos are the original PNG files; the names and prices on the plates
  are live catalog data ("from X" when a product has several sizes). Photos and plates are
  placed in design pixels turned into % (`PODIUM` in `sections.tsx`), so they scale with the
  picture; each plate opens its product. Blocks: zhupka, sary may, kymyz, keremet shypaa,
  navat. On phones the prices are listed under the picture.
- **About us:** meadow photo with a play button that opens the YouTube channel from the
  contacts block, the brand story and "Our story" → `/about`.
- **Our products:** six cards with the company's package photos (sary may, zhupka,
  beshbarmak, kymyz, keremet shypaa, navat) and the catalog price, each opening its product.
- **Promises** and the **closing call** with the yurt and the horse ("Buy" → catalog).
- **Footer** (`components/layout/footer.tsx`): deep green with gold knot ornaments; logo and
  slogan, menu, contacts (phone → WhatsApp, Instagram, place) from the admin `contacts`
  block, copyright and a round "back to top" button.
- **Testimonials** are not on the home page in this design; the admin-managed list stays at
  `/reviews` (`/admin/testimonials`), the carousel component is kept in
  `components/home/testimonials.tsx`.
- **Company product photos** (`public/images/products/*.png`, `lib/product-photos.ts`): the
  package photos the company sent, on a transparent background, stored exactly as sent (no
  cropping of the product, no resizing, no recompression; only the picture with two products
  was split in two). They are shown at quality 95 on the home page and stand in for a product
  in the catalog, product page, cart and gift builder until the admin uploads another photo.

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
