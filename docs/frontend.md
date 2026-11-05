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
  httpOnly cookies, one automatic session refresh on 401).
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

## Not done yet

- Real product photos and the original logo (placeholders are shown).
