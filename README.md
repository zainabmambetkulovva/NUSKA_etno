# NUSKA_etno — Premium Kyrgyz Ethno E-commerce

Премиальный интернет-магазин натуральных и традиционных кыргызских продуктов.

## 📋 Содержание

- [О проекте](#-о-проекте)
- [Технологии](#-технологии)
- [Структура проекта](#-структура-проекта)
- [Установка](#-установка)
- [Команды](#-команды)
- [Переменные окружения](#-переменные-окружения)
- [Документация](#-документация)

## 🎯 О проекте

NUSKA_etno — современный интернет-магазин, объединяющий кыргызское национальное наследие с передовыми технологиями электронной коммерции.

**Основные возможности:**
- Каталог натуральных продуктов
- Система авторизации и личного кабинета
- Корзина и оформление заказов
- Самовывоз
- Административная панель
- Мультиязычность (KG/RU)
- 3D-сцены и интерактивные элементы

## 💻 Технологии

### Frontend
- Next.js (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- GSAP
- Three.js + React Three Fiber
- Zustand
- TanStack Query
- React Hook Form + Zod
- i18next

### Backend
- Node.js
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL (Neon)
- JWT Authentication
- Passport.js

### DevOps
- pnpm Workspaces

## 📁 Структура проекта

```
NUSKA_etno/
├── apps/
│   ├── web/          # Next.js Frontend
│   └── api/          # NestJS Backend
├── packages/
│   ├── types/        # Общие TypeScript-типы
│   ├── validators/   # Общие Zod-схемы валидации
│   └── config/       # Общие конфигурации
├── docs/             # Документация
├── TZ.md             # Техническое задание
├── DATABASE.md       # Спецификация базы данных
└── package.json
```

## 🚀 Установка

### Требования

- Node.js >= 20.0.0
- pnpm >= 9 (`corepack enable` — версия берётся из `packageManager`)
- PostgreSQL 16+ (Neon)

### Шаги установки

1. Клонируйте репозиторий
2. Установите зависимости:
```bash
pnpm install
```

3. Настройте переменные окружения:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

4. Заполните в `apps/api/.env` как минимум `DATABASE_URL`, `DIRECT_URL` и `JWT_SECRET`.

5. Примените миграции:
```bash
pnpm db:deploy
```

6. Заполните базу тестовыми данными:
```bash
pnpm db:seed
```
Если `SEED_ADMIN_PASSWORD` / `SEED_CUSTOMER_PASSWORD` не заданы, seed сгенерирует
пароли и выведет их один раз.

## 📜 Команды

### Development
```bash
pnpm dev              # Запустить все приложения
pnpm dev:web          # Запустить Frontend (порт 3000)
pnpm dev:api          # Запустить Backend (порт 4000)
```

### Production
```bash
pnpm build            # Собрать все приложения
pnpm build:web        # Собрать Frontend
pnpm build:api        # Собрать Backend
```

### Linting & Type Checking
```bash
pnpm lint             # Проверка ESLint
pnpm lint:fix         # Исправление ошибок ESLint
pnpm typecheck        # Проверка TypeScript
pnpm typecheck:web    # Проверка TypeScript Frontend
pnpm typecheck:api    # Проверка TypeScript Backend
pnpm format           # Форматирование кода
pnpm format:check     # Проверка форматирования
```

### Database
```bash
pnpm db:generate      # Сгенерировать Prisma Client
pnpm db:migrate       # Создать новую миграцию из изменений схемы (dev)
pnpm db:deploy        # Применить существующие миграции (Neon / production)
pnpm db:studio        # Открыть Prisma Studio
pnpm db:seed          # Заполнить базу тестовыми данными
```

## 🔑 Переменные окружения

### Backend (.env)

```env
# Environment
NODE_ENV=development
PORT=4000

# CORS
CORS_ORIGINS=http://localhost:3000

# Database (Neon PostgreSQL): pooled URL for the app, direct URL for migrations
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/DBNAME?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/DBNAME?sslmode=require"

# JWT (openssl rand -base64 48)
JWT_SECRET=
JWT_EXPIRES_IN=15m

# Password hashing
BCRYPT_ROUNDS=12
```

Полный список — в `apps/api/.env.example` и [docs/environment-variables.md](docs/environment-variables.md).

## 📚 Документация

- [Техническое задание](TZ.md)
- [Спецификация базы данных](DATABASE.md)
- [Решения по реализации БД](docs/database-notes.md)
- [Project Structure](docs/project-structure.md)
- [Installation Guide](docs/installation.md)
- [Environment Variables](docs/environment-variables.md)

## 🎨 Бренд

**Цвета:**
- Deep Green: `#355B3E`
- Cream Yellow: `#F4E9B9`

## 📞 Контакты

Для вопросов и предложений обращайтесь к команде разработки.

---

**NUSKA_etno** — Вкус кыргызских традиций в современном цифровом формате.
