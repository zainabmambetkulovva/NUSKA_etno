# 🏔️ NUSKA_etno

> Премиальный интернет-магазин натуральных и традиционных кыргызских продуктов

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.1-2D3748)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

---

## 🎯 О проекте

NUSKA_etno — это современная e-commerce платформа для продажи традиционных кыргызских продуктов:
- 🥛 **Навет** (нават) — традиционные молочные сладости
- 🧀 **Курут** — кыргызский сушеный сыр
- 🧈 **Быштак** — домашний сыр

### ✨ Ключевые особенности

- 🌐 **Двуязычность**: KG/RU
- 🎨 **Премиум дизайн**: Современный UI с кыргызскими мотивами
- 🔐 **Google OAuth**: Быстрая авторизация
- 📦 **Самовывоз**: Пункты выдачи по Бишкеку
- 💳 **Онлайн оплата**: Интеграция с Finix
- ☁️ **AWS S3**: Хранение изображений продуктов
- 🐳 **Docker**: Готов к деплою

---

## 🏗️ Архитектура

### Monorepo структура

```
NUSKA_etno/
├── apps/
│   ├── web/           # Frontend (Next.js 15 + React 19)
│   └── api/           # Backend (NestJS + Prisma)
├── packages/
│   ├── types/         # Shared TypeScript types
│   ├── validators/    # Shared validation schemas
│   └── config/        # Shared configurations
├── docker/            # Docker configurations
└── docs/              # Documentation
```

### Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript 5.7
- Tailwind CSS 3.4
- Framer Motion (animations)
- Three.js + React Three Fiber (3D)
- Zustand (state management)
- React Query (data fetching)

**Backend:**
- NestJS 10
- Prisma ORM 6.1
- PostgreSQL (Neon)
- JWT Authentication
- Passport (Google OAuth)
- AWS SDK (S3)
- Swagger (API docs)

---

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/zainabmambetkulovva/NUSKA_etno.git
cd NUSKA_etno
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка переменных окружения

```bash
# Backend
cp apps/api/.env.example apps/api/.env
# Заполните переменные в apps/api/.env

# Frontend
cp apps/web/.env.local.example apps/web/.env.local
# Заполните переменные в apps/web/.env.local
```

### 4. Настройка базы данных

```bash
npm run db:generate   # Генерация Prisma Client
npm run db:migrate    # Запуск миграций
npm run db:seed       # Заполнение тестовыми данными
```

### 5. Запуск проекта

```bash
npm run dev
```

Откройте в браузере:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api/docs

---

## 🐳 Docker

```bash
# Сборка и запуск
docker-compose up --build

# Запуск в фоновом режиме
docker-compose up -d

# Остановка
docker-compose down
```

---

## 📚 Документация

- [📖 Setup Guide](./SETUP_GUIDE.md) - Подробное руководство по установке
- [🗄️ Database Schema](./DATABASE.md) - Описание схемы БД
- [📋 Technical Specification](./TZ.md) - Техническое задание

---

## 🎨 UI Components

✅ **Header** - Навигация, переключение языка, авторизация
✅ **HeroSection** - 3D вращающаяся композиция продуктов
✅ **WhyChooseUs** - 4 причины выбрать NUSKA
✅ **PriceSection** - Анимированные карточки цен
✅ **ReviewsSection** - Премиум карусель с отзывами
✅ **Footer** - Контакты, ссылки, соцсети

---

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - Выход

### Products
- `GET /api/products` - Список продуктов
- `GET /api/products/:id` - Детали продукта
- `POST /api/products` - Создание (admin)
- `PUT /api/products/:id` - Обновление (admin)

### Cart
- `GET /api/cart` - Корзина пользователя
- `POST /api/cart/items` - Добавить в корзину
- `DELETE /api/cart/items/:id` - Удалить из корзины

### Orders
- `POST /api/orders` - Создать заказ
- `GET /api/orders` - История заказов
- `GET /api/orders/:id` - Детали заказа

**Полная документация**: http://localhost:4000/api/docs

---

## 🌍 Переменные окружения

### Backend (`apps/api/.env`)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=nuska-etno-uploads
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

---

## 📦 Доступные команды

```bash
# Разработка
npm run dev              # Запуск dev-серверов
npm run build            # Сборка для продакшн
npm run start            # Запуск продакшн версии

# База данных
npm run db:generate      # Генерация Prisma Client
npm run db:migrate       # Запуск миграций
npm run db:seed          # Заполнение данными
npm run db:studio        # Prisma Studio GUI

# Качество кода
npm run lint             # ESLint
npm run format           # Prettier
npm run typecheck        # TypeScript проверка
```

---

## 🛠️ Статус разработки

### ✅ Готово

- [x] Monorepo структура
- [x] Backend API (14 модулей)
- [x] Frontend UI компоненты
- [x] Prisma схема (24 модели)
- [x] Google OAuth интеграция
- [x] AWS S3 file storage
- [x] Docker configuration
- [x] Tailwind CSS setup
- [x] i18n (KG/RU)

### 🚧 В разработке

- [ ] Login/Register страницы
- [ ] Catalog страница
- [ ] Product Detail страница
- [ ] Cart & Checkout flow
- [ ] User Profile
- [ ] Admin Panel
- [ ] Finix Payment интеграция
- [ ] Email уведомления
- [ ] Unit & E2E тесты

---

## 👥 Команда

**GitHub**: https://github.com/zainabmambetkulovva/NUSKA_etno

---

## 📞 Контакты

- 📱 **WhatsApp**: [+996 701 111 024](https://wa.me/996701111024)
- 💬 **Telegram**: [@nuska_etnokatalog](https://t.me/nuska_etnokatalog)
- 📺 **YouTube**: [@nuskaetno](https://youtube.com/@nuskaetno?si=oCiBT0GwrmoR7wV0)
- 📧 **Email**: info@nuska-etno.kg

---

## 📄 Лицензия

MIT License - смотрите [LICENSE](./LICENSE)

---

<div align="center">
  <p>Создано с ❤️ для кыргызских традиций</p>
  <p><strong>NUSKA_etno</strong> © 2024</p>
</div>
