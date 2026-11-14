# Project Structure

## Overview

NUSKA_etno использует Monorepo архитектуру на базе pnpm Workspaces.

## Directory Structure

```
NUSKA_etno/
├── apps/                    # Приложения
│   ├── web/                 # Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/         # App Router pages
│   │   │   ├── components/  # React components
│   │   │   │   ├── ui/      # UI primitives
│   │   │   │   ├── layout/  # Layout components
│   │   │   │   ├── shared/  # Shared components
│   │   │   │   └── 3d/      # 3D components
│   │   │   ├── features/    # Feature modules
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── lib/         # Utility functions
│   │   │   ├── services/    # API services
│   │   │   ├── store/       # Zustand store
│   │   │   ├── types/       # TypeScript types
│   │   │   ├── i18n/        # Internationalization
│   │   │   └── styles/      # Global styles
│   │   ├── public/          # Static assets
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   │
│   └── api/                 # NestJS Backend
│       ├── .env.example     # Environment variables template
│       ├── src/
│       │   ├── app.module.ts
│       │   ├── app.setup.ts  # Shared app config (prefix /api, pipes, cookies, helmet, CORS, Swagger)
│       │   ├── main.ts
│       │   ├── config/      # Environment validation
│       │   ├── common/      # Decorators (@Public, @Roles, @CurrentUser, @RequestLocale), DTOs, errors, utils
│       │   ├── prisma/      # Prisma Service
│       │   ├── auth/        # Register, login, refresh, logout, password reset, e-mail verification
│       │   ├── users/       # Profile (/users/me) and admin user management
│       │   ├── categories/  # Public tree + admin CRUD
│       │   ├── products/    # Public catalog + admin CRUD, stock, images
│       │   ├── inventory/   # The only place that changes stock
│       │   ├── cart/        # Server cart, guest cart merge
│       │   ├── orders/      # Checkout, status machine, admin orders
│       │   ├── payments/    # Payment records, idempotent provider events
│       │   ├── favorites/
│       │   ├── reviews/     # Post-purchase reviews with moderation
│       │   ├── notifications/ # In-app notifications (RU/KY)
│       │   ├── pickup-locations/
│       │   ├── content/     # Banners and editable text blocks
│       │   ├── admin/       # Dashboard
│       │   ├── audit/       # Audit log of admin actions
│       │   ├── uploads/     # S3-compatible image storage
│       │   ├── mail/        # SMTP e-mail
│       │   └── health/      # Health check
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── seed.ts
│       │   └── migrations/
│       ├── test/            # E2E tests (real PostgreSQL)
│       ├── package.json
│       ├── nest-cli.json
│       └── tsconfig.json
│
├── packages/                # Shared packages
│   ├── types/               # Common TypeScript types
│   ├── validators/          # Zod validation schemas
│   └── config/              # Shared configurations
│
├── docs/                    # Documentation
├── TZ.md                    # Technical specification
├── DATABASE.md              # Database specification
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── tsconfig.base.json
```

## Monorepo Rules

1. **Backend** не зависит от **Frontend**
2. **Frontend** зависит от `@nuska/types`
3. **Backend** зависит от `@nuska/types` и `@nuska/validators`
4. `@nuska/config` содержит общие конфигурации
5. Все пакеты имеют свои `package.json` и `tsconfig.json`

## Module Architecture (Backend)

Backend использует Modular Monolith архитектуру:

```
apps/api/src/{module}/
├── {module}.module.ts      # NestJS module
├── {module}.controller.ts  # HTTP controllers
├── {module}.service.ts     # Business logic
├── dto/                    # Data Transfer Objects
│   ├── {module}.dto.ts
│   └── ...
└── strategies/            # Auth strategies
    └── jwt.strategy.ts
```

## Feature Structure (Frontend)

```
apps/web/src/features/
├── auth/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── profile/
│       └── page.tsx
├── catalog/
│   ├── page.tsx
│   └── [slug]/
│       └── page.tsx
├── cart/
│   └── page.tsx
├── checkout/
│   └── page.tsx
└── ...
```
