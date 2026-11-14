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
- Logo (`components/brand/logo.tsx`): the NUSKA logo the company sent on a transparent
  background, the five swirls only (`public/images/logo-nuska.png`, used as sent; the word
  "Nuska" under them is cut off at the clean gap between them, no pixel is changed) with the
  name NUSKA_etno in Lora, in the header, the phone menu (on a green badge,
  because its white swirl needs a dark ground) and the footer. The browser tab icon
  (`src/app/icon.png`, `apple-icon.png`) is the same logo on a green rounded square. The gold
  knot (`LogoMark`) is only a decoration.
- Ornament: «кочкор мүйүз» (`components/brand/ornament.tsx`) and the decor of the design
  (`components/brand/kyrgyz-decor.tsx`): gold corner ornaments, section waves, swaying
  leaves, mountain line art and silhouettes, the ram's horn band of the footer.
- Animations respect `prefers-reduced-motion`; product cards tilt only for mouse input.

## Home page after the NUSKA_etno mockup (master brief, stage 2)

Top to bottom (`app/[locale]/page.tsx`, `components/home/hero.tsx`, `components/home/landing.tsx`):

- **Header** (`components/layout/header.tsx`): logo; «Каталог ⌄» (dropdown of the real
  categories, passed from the layout); О бренде · Доставка и оплата · Рецепты · Контакты;
  KG/RU menu (`language-menu.tsx`); search, favorites, cart (count badge), account (sign in /
  register menu, or the cabinet). Transparent over the cream hero, a cream bar once scrolled.
  The menu shows from 1180 px; below it a drawer with the same links and the categories.
- **Hero**: badge, «Природная сила Кыргызстана», subtitle, «Перейти в каталог» and
  «▶ Узнать больше» (the YouTube channel, or the brand section). The company's picture
  `hero.png` is shown untouched (`unoptimized`); only its lower 62 % is in view, so the logo
  painted in its sky stays out of the frame. On it: the company's packages on a wooden stump
  with a felt carpet (SVG), drifting clouds and a gliding eagle (`brand/nature-decor.tsx`).
- **Benefits bar**: five company claims only (100 % natural composition as on the labels, from
  Kyrgyzstan, high quality, delivery and pickup, customer care).
- **Categories** («Сила природы в каждой детали»): one arch per real category, with the
  company's dish photos (`CATEGORY_PHOTOS`); «Мясные продукты» shows an ornament until a photo
  is sent.
- **About the brand** («Больше, чем натуральные продукты», `#brand`): the valley `cta.png`
  with the girl `brand-girl.webp` (as sent), the text, «Узнать больше» → /about, and the four
  values confirmed by the company.
- **Origin map + bestsellers**: an interactive SVG map of the seven oblasts
  (`home/kg-regions.ts`, outlines from the MIT package `@react-map/kyrgyzstan`) with the
  company's region list (`lib/origin.ts`: where a product is *traditionally made*, not the
  production address); the full version is `/origin`. «Хиты продаж» is a carousel of catalog
  products (featured first, then the most ordered) with size, availability, ♥ and cart; it
  scrolls by drag, swipe, wheel and the arrows.
- Below, the earlier blocks the company asked to keep: why us, prices podium, story, products,
  promises, closing call.
- **Footer**: mountain ridge, logo, tagline, Instagram / YouTube / WhatsApp / Telegram,
  Catalog (real categories), Company, Help, newsletter (double opt-in, consent checkbox),
  legal links.

New pages: `/delivery` (only confirmed facts: pickup, delivery agreed in WhatsApp, cash on
receipt; online payment named as coming), `/recipes` (traditional recipes linked to the
products), `/origin`, and `/contacts` rebuilt as contact cards. Colours of the mockup are the
`nk-*` Tailwind tokens; `.btn-forest` is the dark green pill button.

## Earlier home page (kept blocks)


The home page follows the full-page design the company sent, top to bottom:
header → hero → "Why choose us?" → "Our prices" (podium) → about us → "Our products" →
promises → closing call → footer (the closing banner uses `cta.png`, a yurt in the mountains). Sections live in `components/home/hero.tsx` and
`components/home/sections.tsx`.

- **Pictures** (`public/images/home`): `hero.png` and `cta.png` are the company's pictures
  used exactly as sent (shown through next/image at quality 95, never cut or enhanced). The
  podium base and a few other scenes were cut out of the old design picture and are a little
  soft; replace a file with a full-resolution picture of the same proportions to sharpen it.
- **Header** (`components/layout/header.tsx`): unchanged — logo, menu (Home · About · Our
  prices · Contacts), KG/RU, separate "Sign in" and "Register" buttons, cart icon only when
  the cart is not empty. Transparent over the hero.
- **Hero:** the company's picture (`hero.png`: the NUSKA logo above a yurt, horses, curd and a
  bowl of milk) starts below the header strip (the logo painted in it sits right under the menu
  line) and dissolves into the strip at the top, so there is no seam. It is served untouched
  (`unoptimized`: no AVIF/WebP re-encoding, no zoom). The slogan, the text and the "Go to the
  catalog" button stand on its left side over a light dark-green veil; on phones the text is
  under the picture. A cream wave with the gold knot closes it. The menu is shown from 1180 px.
- **Why choose us?:** title on cream, four deep green cards with gold icons. The border of the
  cards lights up gold one card after another, 2 s each, in a loop (`border-glow`).
- **Our prices** (`PricesPodium`): the wooden podium of the design (`podium-base.webp`, the
  drawn products removed) with the company's own product photos standing on its blocks and a
  plate under each. The photos are the original PNG files; the names and prices on the plates
  are live catalog data ("from X" when a product has several sizes). Photos and plates are
  placed in design pixels turned into % (`PODIUM` in `sections.tsx`), so they scale with the
  picture; each plate opens its product. Blocks: zhupka, sary may, kymyz, keremet shypaa,
  navat. On phones the prices are listed under the picture.
- **About us:** the company's meadow photo (`about.png`, as sent) with a play button that opens the YouTube channel from the
  contacts block, the brand story and "Our story" → `/about`.
- **Our products:** seven cards with the company's dish photos (`public/images/dishes`, stored
  exactly as sent): sary may, zhupka, beshbarmak, kymyz, navat, honey, keremet shypaa, with the
  catalog price; each opens its product. Four per row on desktop (4 + 3, centred).
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

## Product page texts

`/product/[slug]` shows, in this order: description → **benefits** («Пайдасы», one per line)
→ composition («Курамы / эмнеден жасалат») → storage, next to the price in som. The texts are
editable in the admin product form (fields description, ingredients, benefits, storage).
`apps/api/prisma/product-content.json` holds a first DRAFT of these texts for every dish, written
without numbers or health promises; the company must check them. The migration
`20261112100000_product_page_content` and the seed fill only EMPTY fields, so admin edits are
never overwritten.

## Leaves, hover and the footer

- Every `Leaf` (and the leaf icons in the cards) drifts and sways all the time (`leaf-drift`);
  with "reduce motion" it only slows down.
- "Our prices": the product photo and its plate rise and glow on hover. If the catalog cannot be
  reached, the plates still show the product names and lead to the catalog.
- **Footer:** logo, slogan, round Instagram / WhatsApp / YouTube buttons, the menu and the
  contacts as small cards. The contacts come from the admin `contacts` block; the company's own
  values (`lib/contacts.ts`) are used when it is empty or the API is down.
- **Back to top** (`components/layout/back-to-top.tsx`): a fixed gold button right above the
  NUSKA AI button, shown after scrolling, hidden while the AI chat is open and in the admin panel.

## 3D and animation system (master brief, stage 3)

- **Hero stage** (`components/home/hero-stage.tsx`): the hero tracks the mouse (-1..1) and the
  scroll progress through itself (0..1). Its layers move at different depths: the picture
  slightly against the mouse, the products, eagle and text with it; while scrolling the
  picture and the product podium zoom toward the products and the text lifts and fades.
- **WebGL atmosphere** (`components/three/hero-atmosphere.tsx`, React Three Fiber): drifting
  clouds, golden pollen (one GPU-animated point cloud) and light shafts, all drawn in code
  (no downloads). The camera leans toward the mouse and dollies toward the products on scroll.
  Loaded with `next/dynamic` only on desktops (≥ 1024 px, fine pointer, WebGL, no reduced
  motion) when the browser is idle; the render loop stops while the hero is off screen;
  textures and geometries are disposed on unmount; DPR ≤ 1.5. Phones keep CSS clouds.
- **Products**: there are no real 3D models of the packages, so the brief's rule applies —
  the company's photos with layered animation, no invented 3D objects: they float over the
  stump in the hero, and on the product page the package photo floats over a wooden stand
  with a breathing shadow and tilts toward the pointer (`product-gallery.tsx`). The
  procedural 3D packaging viewer stays behind the «3D» switch.
- **Scroll animations** (`components/motion/*`, framer-motion — GSAP was not added, the
  installed library covers it): `TextReveal` (words rise from a mask), `ImageReveal`
  (curtain + settle), `Parallax`, `HoneyDivider` (a golden wave draws itself and a drop of
  honey runs down) between sections.
- **Micro-interactions**: `Tilt` on category arches and bestseller cards, `Magnetic` on the
  hero button, heart burst on «add to favorites», cart shake + count bump, page fade between
  routes (`app/[locale]/template.tsx`). No `loading.tsx`: a streaming boundary would answer
  missing pages with status 200 instead of 404.
- **Reduced motion**: the markup is the same on server and client; movement is multiplied by
  `useMotionEnabled()` (0 with reduced motion) and MotionConfig `reducedMotion="user"` keeps
  only fades. No WebGL is loaded then. Tests: `e2e/three.spec.ts`.
