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
│       ├── src/
│       │   ├── app.module.ts
│       │   ├── main.ts
│       │   ├── auth/        # Authentication module
│       │   ├── users/       # Users module
│       │   ├── products/    # Products module
│       │   ├── categories/  # Categories module
│       │   ├── cart/        # Cart module
│       │   ├── favorites/   # Favorites module
│       │   ├── orders/      # Orders module
│       │   ├── payments/    # Payments module
│       │   ├── pickup-locations/
│       │   ├── reviews/     # Reviews module
│       │   ├── notifications/
│       │   ├── admin/       # Admin module
│       │   ├── uploads/     # File uploads
│       │   ├── health/      # Health check
│       │   └── prisma/      # Prisma Service
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── seed.ts
│       │   └── migrations/
│       ├── test/
│       ├── package.json
│       ├── nest-cli.json
│       └── tsconfig.json
│
├── packages/                # Shared packages
│   ├── types/               # Common TypeScript types
│   ├── validators/          # Zod validation schemas
│   └── config/              # Shared configurations
│
├── docker/                  # Docker configuration
├── docs/                    # Documentation
├── .env.example             # Environment variables template
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
