-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('PENDING', 'ACTIVE', 'UNSUBSCRIBED');

-- CreateTable
CREATE TABLE "faq_items" (
    "id" UUID NOT NULL,
    "category" VARCHAR(40) NOT NULL DEFAULT 'other',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_item_translations" (
    "id" UUID NOT NULL,
    "faq_item_id" UUID NOT NULL,
    "locale" VARCHAR(5) NOT NULL,
    "question" VARCHAR(300) NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "faq_item_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "locale" VARCHAR(5) NOT NULL DEFAULT 'ky',
    "status" "NewsletterStatus" NOT NULL DEFAULT 'PENDING',
    "consent_at" TIMESTAMP(3) NOT NULL,
    "confirm_token_hash" VARCHAR(64),
    "confirm_sent_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "unsubscribed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_items_is_active_category_sort_order_idx" ON "faq_items"("is_active", "category", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "faq_item_translations_faq_item_id_locale_key" ON "faq_item_translations"("faq_item_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_confirm_token_hash_key" ON "newsletter_subscribers"("confirm_token_hash");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers"("status");

-- AddForeignKey
ALTER TABLE "faq_item_translations" ADD CONSTRAINT "faq_item_translations_faq_item_id_fkey" FOREIGN KEY ("faq_item_id") REFERENCES "faq_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data integrity
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_category_check" CHECK ("category" ~ '^[a-z][a-z0-9-]*$');
ALTER TABLE "faq_item_translations" ADD CONSTRAINT "faq_item_translations_locale_check" CHECK ("locale" IN ('ky', 'ru'));
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_email_lower_check" CHECK ("email" = lower("email"));
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_locale_check" CHECK ("locale" IN ('ky', 'ru'));
