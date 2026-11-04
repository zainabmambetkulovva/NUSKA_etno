# Installation Guide

## Requirements

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL (Neon)
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

Create `.env` file for backend:

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and configure:

```env
NODE_ENV=development
PORT=4000

# CORS
CORS_ORIGINS=http://localhost:3000

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.aws.region.neon.tech/dbname?sslmode=require"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Encryption
BCRYPT_ROUNDS=10
```

### 4. Database Setup

Generate Prisma Client:

```bash
pnpm db:generate
```

Run migrations:

```bash
pnpm db:migrate
```

Seed database with test data:

```bash
pnpm db:seed
```

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
- Open http://localhost:3000
- Verify page loads

### Backend
- Open http://localhost:4000/health
- Verify health check response

### Swagger
- Open http://localhost:4000/api/docs
- Verify API documentation

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

3. Run migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

4. Start production server:

```bash
pnpm build:api
node apps/api/dist/main
```
