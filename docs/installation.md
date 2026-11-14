# Installation Guide

## Requirements

- Node.js >= 20.0.0
- pnpm >= 9 (`corepack enable`)
- PostgreSQL 16+ (Neon)
- Git

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd NUSKA_etno
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Fill in at least `DATABASE_URL`, `DIRECT_URL` and `JWT_SECRET` in `apps/api/.env`
(see [environment-variables.md](environment-variables.md)).

### 4. Database Setup

Generate Prisma Client:

```bash
pnpm db:generate
```

Apply migrations (works for Neon and local PostgreSQL):

```bash
pnpm db:deploy
```

When you change `schema.prisma`, create a new migration with `pnpm db:migrate`
(needs a database where Prisma can create a shadow database).

Seed database with test data (idempotent):

```bash
pnpm db:seed
```

Demo account passwords come from `SEED_ADMIN_PASSWORD` / `SEED_CUSTOMER_PASSWORD`;
if they are empty, random passwords are generated and printed once.

### 5. Run Development Servers

Start both Frontend and Backend:

```bash
pnpm dev
```

Or run separately:

```bash
pnpm dev:web  # Frontend on port 3000
pnpm dev:api  # Backend on port 4000
```

## Verification

### Frontend
- Open http://localhost:3000 — redirects to `/ky` (Kyrgyz is the default language, `/ru` for Russian)
- The site talks to the API through its own `/api` proxy (`API_INTERNAL_URL`)

### Backend
- Open http://localhost:4000/api/health
- Verify health check response

### Swagger
- Open http://localhost:4000/api/docs (development only)
- Verify API documentation

## Tests

```bash
pnpm --filter @nuska/api test        # unit tests
```

E2E tests run the whole API against a real PostgreSQL database. Use a **separate**
database whose name contains `test` — every test wipes it:

```bash
TEST_DATABASE_URL=postgresql://postgres@localhost:5432/nuska_test pnpm --filter @nuska/api test:e2e
```

Migrations are applied to it automatically.

## Troubleshooting

### pnpm install fails

```bash
# Clear cache
pnpm store prune

# Clear node_modules
rm -rf node_modules
rm pnpm-lock.yaml

# Reinstall
pnpm install
```

### Database connection fails

1. Verify DATABASE_URL in .env
2. Check Neon database is accessible
3. Verify SSL mode in connection string

### TypeScript errors

```bash
pnpm typecheck
```

### Frontend build fails

```bash
pnpm build:web
```

### Backend build fails

```bash
pnpm build:api
```

## Production Deployment

1. Build for production:

```bash
pnpm build
```

2. Set NODE_ENV=production

3. Apply migrations:

```bash
pnpm db:generate
pnpm db:deploy
```

4. Start production server:

```bash
pnpm build:api
node apps/api/dist/main
```
