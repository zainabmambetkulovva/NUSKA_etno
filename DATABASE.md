# NUSKA_etno — Database Specification

**Версия:** 1.0  
**Database:** Neon PostgreSQL  
**ORM:** Prisma  
**Backend:** NestJS + Node.js + TypeScript  
**Язык:** TypeScript  
**Архитектура:** Monorepo

---

# 1. Общая архитектура базы данных

База данных NUSKA_etno предназначена для полноценного интернет-магазина натуральных и традиционных кыргызских продуктов.

База должна обеспечивать:

- Управление пользователями.
- Авторизацию и сессии.
- Управление товарами.
- Управление категориями.
- Мультиязычность.
- Управление фотографиями.
- Учёт остатков.
- Корзину.
- Избранное.
- Оформление заказов.
- Самовывоз.
- Платежи.
- Историю статусов заказов.
- Отзывы.
- Уведомления.
- Административный аудит.

Использовать PostgreSQL в Neon и Prisma ORM.

Все основные связи должны быть реляционными и обеспечивать целостность данных.

# 2. Основные правила проектирования

## 2.1. Именование

- Prisma Models: PascalCase.
- Enum names: PascalCase.
- Enum values: UPPER_SNAKE_CASE.
- Fields: camelCase.
- PostgreSQL tables: snake_case через `@@map`.
- PostgreSQL columns: snake_case через `@map`.

Пример:

```prisma
model User {
  id        String   @id @default(uuid()) @db.Uuid
  firstName String?  @map("first_name")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("users")
}
```

## 2.2. Общие требования

- Для основных идентификаторов использовать UUID.
- Для времени использовать `DateTime`.
- Для дат использовать UTC.
- Для денег использовать целые числа.
- Основная валюта — KGS.
- Для цен использовать целые значения в тыйынах.
- Для сущностей предусмотреть `createdAt` и `updatedAt`.
- Для подходящих сущностей предусмотреть `deletedAt`.
- Все важные связи должны иметь Foreign Keys.
- Для часто используемых полей создать индексы.

Не хранить реальные изображения и файлы непосредственно в PostgreSQL.

В БД сохранять URL и метаданные файлов.

# 3. Enum

Предусмотреть следующие перечисления:

```prisma
enum UserRole {
  USER
  ADMIN
}

enum ProductType {
  FOOD
  BEVERAGE
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY_FOR_PICKUP
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
  REFUNDED
  CANCELLED
}

enum PaymentMethod {
  CASH
  ONLINE
}

enum StockMovementType {
  IN
  OUT
  ADJUSTMENT
  RETURN
}

enum NotificationType {
  ORDER_CREATED
  ORDER_CONFIRMED
  ORDER_READY
  ORDER_COMPLETED
  ORDER_CANCELLED
  GENERAL
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}
```

Не добавлять статусы и типы без реальной необходимости.

# 4. Пользователи и авторизация

## 4.1. User

Таблица пользователей.

Поля:

- id.
- firstName.
- lastName.
- email.
- phone.
- passwordHash.
- role.
- emailVerifiedAt.
- isActive.
- deletedAt.
- createdAt.
- updatedAt.

Требования:
- Email уникальный.
- Телефон хранить в нормализованном формате.
- Пароли хранить только в виде безопасного хеша.
- Удаление пользователя выполнять через soft-delete.
- Роль USER назначать по умолчанию.

## 4.2. Session

Сессии авторизованных пользователей.

Поля:
- id.
- userId.
- tokenHash.
- expiresAt.
- createdAt.
- updatedAt.

Не хранить открытые session tokens.

## 4.3. PasswordResetToken

Токены восстановления пароля.

Поля:
- id.
- userId.
- tokenHash.
- expiresAt.
- usedAt.
- createdAt.

## 4.4. EmailVerificationToken

Токены подтверждения email.

Поля:
- id.
- userId.
- tokenHash.
- expiresAt.
- usedAt.
- createdAt.

# 5. Категории товаров

## 5.1. Category

Поля:
- id.
- parentId.
- slug.
- imageUrl.
- sortOrder.
- isActive.
- deletedAt.
- createdAt.
- updatedAt.

Поддерживать вложенные категории через parentId.

Например:

- Национальные сладости.
- Молочные продукты.
- Традиционные блюда.
- Мясные продукты.
- Натуральный мёд.

## 5.2. CategoryTranslation

Таблица переводов категорий.

Поля:
- id.
- categoryId.
- locale.
- name.
- description.

Уникальность:
- categoryId + locale.

Поддерживаемые языки:
- ru.
- ky.

# 6. Товары

## 6.1. Product

Единая таблица товаров.

Поля:
- id.
- sku.
- slug.
- type.
- status.
- priceAmount.
- currency.
- stockQuantity.
- trackInventory.
- isFeatured.
- sortOrder.
- deletedAt.
- createdAt.
- updatedAt.

Требования:
- SKU уникальный.
- Slug уникальный.
- Цена хранится в тыйынах.
- Валюта по умолчанию KGS.
- Остаток не может быть отрицательным.
- Удаление товара выполняется через soft-delete.
- Архивирование товара не должно удалять историю заказов.

## 6.2. ProductTranslation

Переводы товаров.

Поля:
- id.
- productId.
- locale.
- name.
- shortDescription.
- description.
- ingredients.
- storageInstructions.

Уникальность:
- productId + locale.

Языки:
- Кыргызский.
- Русский.

Не создавать переводы автоматически из одного языка. Контент должен предоставляться компанией или редактором.

## 6.3. ProductCategory

Связующая таблица товаров и категорий.

Поля:
- productId.
- categoryId.

Один товар может принадлежать нескольким категориям.

## 6.4. ProductImage

Фотографии товаров.

Поля:
- id.
- productId.
- url.
- alt.
- sortOrder.
- isPrimary.
- createdAt.

Один товар может иметь несколько фотографий.

## 6.5. ProductUnit

Единицы продажи.

Поля:
- id.
- productId.
- unitName.
- quantityValue.
- quantityUnit.
- createdAt.
- updatedAt.

Примеры единиц:
- Штука.
- Упаковка.
- Килограмм.
- Литр.
- Грамм.

Не предполагать вес или объём существующих товаров. Заполнять после получения данных от компании.

# 7. Учёт остатков

## 7.1. StockMovement

История движения товаров.

Поля:
- id.
- productId.
- type.
- quantity.
- reason.
- referenceId.
- createdById.
- createdAt.

Типы:
- IN.
- OUT.
- ADJUSTMENT.
- RETURN.

Все изменения остатков должны выполняться через транзакции.

При оформлении заказа необходимо проверять доступное количество.

Нельзя допускать отрицательные остатки.

# 8. Корзина

## 8.1. Cart

Поля:
- id.
- userId.
- createdAt.
- updatedAt.

Для одного пользователя допускается одна активная корзина.

## 8.2. CartItem

Поля:
- id.
- cartId.
- productId.
- quantity.
- createdAt.
- updatedAt.

Ограничения:
- Уникальность cartId + productId.
- Quantity больше нуля.
- Проверять наличие товара при оформлении заказа.

# 9. Избранное

## 9.1. Favorite

Поля:
- id.
- userId.
- productId.
- createdAt.

Ограничения:
- Уникальность userId + productId.

Пользователь не может добавлять один товар в избранное несколько раз.

# 10. Заказы

## 10.1. Order

Поля:
- id.
- orderNumber.
- userId.
- status.
- subtotalAmount.
- totalAmount.
- currency.
- customerName.
- customerPhone.
- customerEmail.
- pickupLocationId.
- pickupTime.
- customerComment.
- confirmedAt.
- completedAt.
- cancelledAt.
- createdAt.
- updatedAt.

Требования:
- Номер заказа уникальный.
- Валюта по умолчанию KGS.
- Суммы хранить в целых тыйынах.
- Контактные данные сохранять как snapshot.
- Историю заказов не удалять физически.

## 10.2. OrderItem

Поля:
- id.
- orderId.
- productId.
- productName.
- productSku.
- quantity.
- unitPriceAmount.
- totalPriceAmount.
- createdAt.

Важно:
- Сохранять название и цену товара на момент заказа.
- Изменение цены товара не должно менять старые заказы.
- Удаление товара не должно разрушать историю заказов.
- Связь с Product должна допускать сохранение исторической позиции даже после удаления или архивирования товара.

## 10.3. OrderStatusHistory

История изменений статуса.

Поля:
- id.
- orderId.
- oldStatus.
- newStatus.
- changedById.
- comment.
- createdAt.

Каждое изменение статуса должно записываться.

# 11. Самовывоз

## 11.1. PickupLocation

Точки самовывоза.

Поля:
- id.
- name.
- address.
- description.
- phone.
- latitude.
- longitude.
- openingHours.
- isActive.
- createdAt.
- updatedAt.

Даже если на первом этапе компания имеет только одну точку, архитектура должна поддерживать несколько.

Адрес и координаты заполняются только после получения информации от компании.

Заказы должны сохранять snapshot адреса выбранной точки, чтобы изменения адреса в будущем не меняли историю заказов.

# 12. Платежи

## 12.1. Payment

Поля:
- id.
- orderId.
- method.
- status.
- amount.
- currency.
- provider.
- providerPaymentId.
- paidAt.
- createdAt.
- updatedAt.

Для одного заказа допускается несколько попыток оплаты.

## 12.2. PaymentEvent

История событий платежей.

Поля:
- id.
- paymentId.
- provider.
- externalEventId.
- eventType.
- payload.
- processedAt.
- createdAt.

Ограничения:
- Защита от повторной обработки одного webhook.
- Уникальность provider + externalEventId.
- Не доверять статусу платежа, полученному только от клиента.

Не хранить данные банковских карт.

# 13. Отзывы

## 13.1. Review

Поля:
- id.
- userId.
- productId.
- orderItemId.
- rating.
- comment.
- status.
- createdAt.
- updatedAt.

Ограничения:
- Rating от 1 до 5.
- Возможность оставить отзыв после покупки.
- Модерация отзывов администратором.
- Не допускать дублирующих отзывов на одну позицию покупки одним пользователем.

# 14. Уведомления

## 14.1. Notification

Поля:
- id.
- userId.
- type.
- title.
- message.
- isRead.
- relatedOrderId.
- createdAt.

Уведомления:
- Заказ создан.
- Заказ подтверждён.
- Заказ готов к самовывозу.
- Заказ завершён.
- Заказ отменён.

Предусмотреть поддержку кыргызского и русского языков.

# 15. Административный аудит

## 15.1. AuditLog

Поля:
- id.
- userId.
- action.
- entityType.
- entityId.
- metadata.
- createdAt.

Использовать для записи важных действий администратора:
- Создание товара.
- Изменение цены.
- Изменение остатков.
- Изменение заказа.
- Изменение статуса.
- Управление пользователями.

# 16. Soft Delete

Использовать поле:

`deletedAt DateTime?`

Для:
- User.
- Product.
- Category.

При soft-delete:
- Скрывать сущности из публичного каталога.
- Исключать удалённых пользователей из обычных списков.
- Не разрушать исторические заказы.
- Не удалять связанные финансовые записи.

Заказы, платежи и история платежей физически не удаляются.

# 17. Индексы и ограничения

Обязательно предусмотреть индексы для:

- User.email.
- User.phone.
- Product.slug.
- Product.sku.
- Product.status.
- Product.deletedAt.
- Category.slug.
- Category.parentId.
- ProductTranslation.locale.
- Cart.userId.
- CartItem.cartId.
- Favorite.userId.
- Order.orderNumber.
- Order.userId.
- Order.status.
- Order.createdAt.
- Payment.orderId.
- Payment.providerPaymentId.
- StockMovement.productId.
- Notification.userId.

Уникальные ограничения:
- User.email.
- Product.sku.
- Product.slug.
- CategoryTranslation(categoryId, locale).
- ProductTranslation(productId, locale).
- CartItem(cartId, productId).
- Favorite(userId, productId).
- PaymentEvent(provider, externalEventId).

Для необязательных уникальных полей учитывать поведение NULL в PostgreSQL.

# 18. Транзакции

Использовать Prisma Transactions для:

1. Оформления заказа.
2. Проверки и резервирования остатков.
3. Списания остатков.
4. Возврата остатков при отмене, если они уже были списаны.
5. Обновления статуса заказа.
6. Создания платёжных записей.

Операции с остатками должны быть защищены от одновременного оформления заказов на один и тот же товар.

Правило момента списания или резервирования остатков необходимо реализовать последовательно и документировать.

# 19. Prisma Schema

Основной файл:

`apps/api/prisma/schema.prisma`

Он должен содержать:
- datasource PostgreSQL.
- Prisma Client generator.
- Все Enum.
- Все Models.
- Relations.
- Indexes.
- Unique constraints.
- Mapping для snake_case.

Схема должна быть валидной для актуальной установленной версии Prisma.

# 20. Seed

Создать seed для тестовых данных.

Добавить:
- Тестовые категории.
- 12 товаров из начального прайса.
- Переводы на кыргызский и русский.
- Тестовые точки самовывоза только с явно обозначенными демонстрационными данными.
- Несколько тестовых заказов.
- Тестовых пользователей.

Не использовать реальные пароли и секреты компании.

Цены начального прайса:
- Нават 0.5 — 100 сом.
- Нават 0.6 — 115 сом.
- Нават 0.7 — 145 сом.
- Беш бармак — 97 сом.
- Каттама — 170 сом.
- Керемет шыпаа классика — 65 сом.
- Керемет шыпаа чычырканак менен — 85 сом.
- Холодец — 110 сом.
- Кымыз — 300 сом.
- Жупка — 85 сом.
- Сары май — 235 сом.
- Бал — 235 сом.

# 21. Структура файлов базы данных

```text
apps/api/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── database/
│   └── prisma/
└── .env.example
```

# 22. Критерии готовности

База данных считается готовой, когда:

- Prisma Schema проходит валидацию.
- Подключение к Neon работает.
- Миграции успешно выполняются.
- Все Relations корректны.
- Индексы и ограничения настроены.
- Seed выполняется.
- Корзина работает с Product.
- Заказы сохраняют snapshot товаров.
- История заказов не зависит от текущей цены.
- Остатки защищены от отрицательных значений.
- Самовывоз связан с заказами.
- Мультиязычные данные хранятся корректно.
- Платёжные события защищены от дублирования.

---

**Итог:** база данных должна быть надёжной основой NUSKA_etno, поддерживать текущий ассортимент и позволять расширять магазин без необходимости перестраивать всю архитектуру.