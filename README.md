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
- Docker

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
├── docker/           # Docker конфигурация
├── docs/             # Документация
├── .env.example      # Пример переменных окружения
└── package.json
```

## 🚀 Установка

### Требования

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL (Neon)

### Шаги установки

1. Клонируйте репозиторий
2. Установите зависимости:
```bash
pnpm install
```

3. Настройте переменные окружения:
```bash
cp apps/api/.env.example apps/api/.env
```

4. Настройте DATABASE_URL в файле `apps/api/.env`

5. Запустите миграции:
```bash
pnpm db:generate
pnpm db:migrate
```

6. Заполните базу тестовыми данными:
```bash
pnpm db:seed
```

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
pnpm db:migrate       # Применить миграции
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

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.aws.region.neon.tech/dbname?sslmode=require"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Encryption
BCRYPT_ROUNDS=10
```

## 📚 Документация

- [Technical Specification](docs/technical-specification.md)
- [Database Specification](docs/database-specification.md)
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
