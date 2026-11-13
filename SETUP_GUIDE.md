# 🚀 NUSKA_etno - Руководство по установке и запуску

## 📋 Содержание
1. [Требования](#требования)
2. [Установка зависимостей](#установка-зависимостей)
3. [Настройка окружения](#настройка-окружения)
4. [Запуск в режиме разработки](#запуск-в-режиме-разработки)
5. [Docker](#docker)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Требования

- **Node.js**: v18+ или v20+
- **npm**: v9+ (или pnpm v8+)
- **PostgreSQL**: Neon Database (уже настроен)
- **Docker**: (опционально) для контейнеризации

---

## 📦 Установка зависимостей

### Вариант 1: npm (рекомендуется из-за сетевых проблем)

```bash
npm install
```

### Вариант 2: pnpm (если network работает)

```bash
pnpm install
```

---

## ⚙️ Настройка окружения

### 1. Backend Environment (.env)

Файл находится в: `apps/api/.env`

**Уже настроено:**
- ✅ DATABASE_URL (Neon PostgreSQL)
- ✅ JWT_SECRET
- ✅ CORS_ORIGINS

**НУЖНО ДОБАВИТЬ:**

#### Google OAuth
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 credentials
5. Authorized redirect URIs: `http://localhost:4000/api/auth/google/callback`

```env
GOOGLE_CLIENT_ID=ваш-google-client-id
GOOGLE_CLIENT_SECRET=ваш-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

#### AWS S3
1. Создайте AWS аккаунт
2. Создайте S3 bucket: `nuska-etno-uploads`
3. Создайте IAM пользователя с правами S3

```env
AWS_ACCESS_KEY_ID=ваш-aws-access-key
AWS_SECRET_ACCESS_KEY=ваш-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=nuska-etno-uploads
```

#### Finix Payment (добавите позже)
```env
FINIX_API_KEY=your-finix-api-key
FINIX_WEBHOOK_SECRET=your-finix-webhook-secret
FINIX_ENVIRONMENT=sandbox
```

### 2. Frontend Environment (.env.local)

Создайте файл: `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this
NEXT_PUBLIC_GOOGLE_CLIENT_ID=ваш-google-client-id
```

---

## 🗄️ База данных (Prisma)

### 1. Генерация Prisma Client

```bash
npm run db:generate
# или
pnpm db:generate
```

### 2. Запуск миграций

```bash
npm run db:migrate
# или
pnpm db:migrate
```

### 3. Заполнение тестовыми данными (seed)

```bash
npm run db:seed
# или
pnpm db:seed
```

---

## 🚀 Запуск в режиме разработки

### Запуск всего проекта

```bash
npm run dev
```

Это запустит:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Swagger Docs**: http://localhost:4000/api/docs

### Запуск отдельно

#### Backend только
```bash
cd apps/api
npm run start:dev
```

#### Frontend только
```bash
cd apps/web
npm run dev
```

---

## 🐳 Docker

### Сборка и запуск

```bash
# Сборка контейнеров
docker-compose build

# Запуск
docker-compose up

# Запуск в фоновом режиме
docker-compose up -d

# Остановка
docker-compose down
```

### Переменные окружения для Docker

Создайте файл `.env` в корне проекта:

```env
# Database
DATABASE_URL=postgresql://neondb_owner:npg_jeCa5Bf2MSdT@ep-bitter-morning-be1fmhd8-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGINS=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=nuska-etno-uploads

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

---

## 🔧 Troubleshooting

### Проблема: `npm install` не работает

**Ошибка**: `EUNSUPPORTEDPROTOCOL` или `workspace:*`

**Решение**: Все уже исправлено! Теперь используются npm-совместимые версии.

```bash
# Очистить кэш
npm cache clean --force

# Удалить node_modules
rm -rf node_modules

# Установить заново
npm install
```

### Проблема: Prisma не генерируется

**Решение**:
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
```

### Проблема: Docker build падает

**Решение**: Убедитесь что `.env` файл создан в корне проекта с правильными переменными.

### Проблема: Google OAuth не работает

**Проверьте**:
1. ✅ Credentials созданы в Google Cloud Console
2. ✅ Redirect URI правильный: `http://localhost:4000/api/auth/google/callback`
3. ✅ Client ID и Secret в `.env`
4. ✅ Google+ API включен

### Проблема: S3 upload не работает

**Проверьте**:
1. ✅ AWS credentials правильные
2. ✅ S3 bucket создан
3. ✅ IAM пользователь имеет права на S3
4. ✅ CORS настроен в S3 bucket

---

## 📚 Полезные команды

```bash
# Форматирование кода
npm run format

# Линтинг
npm run lint

# TypeScript проверка
npm run typecheck

# Тесты (когда добавите)
npm run test

# Prisma Studio (GUI для БД)
npm run db:studio

# Build для продакшн
npm run build

# Запуск продакшн версии
npm run start
```

---

## 🎯 Что уже готово

✅ Monorepo структура (apps/web, apps/api, packages/*)
✅ Backend: NestJS + 14 модулей
✅ Frontend: Next.js 15 + React 19
✅ Prisma ORM + Neon PostgreSQL
✅ Google OAuth интеграция
✅ AWS S3 file storage
✅ Docker configuration
✅ UI Components:
  - Header (logo, menu, language switcher, auth buttons)
  - HeroSection (3D rotating composition)
  - WhyChooseUs (4 reasons with products)
  - PriceSection (animated price cards)
  - ReviewsSection (premium carousel with reviews)
  - Footer (3 columns: logo, links, contacts)

---

## 🚧 Что нужно доделать

1. **Login/Register Pages** (UI + API integration)
2. **Catalog Page** (product listing + filters)
3. **Product Detail Page**
4. **Cart Page** (add/remove items)
5. **Checkout Flow** (order creation)
6. **User Profile Page**
7. **Admin Panel** (product management)
8. **Finix Payment Integration** (когда получите ключи)
9. **Email notifications**
10. **Tests** (unit + e2e)

---

## 📞 Контакты

**GitHub**: https://github.com/zainabmambetkulovva/NUSKA_etno.git
**WhatsApp**: +996 701 111 024
**Telegram**: @nuska_etnokatalog
**YouTube**: @nuskaetno

---

Удачи! 🚀
