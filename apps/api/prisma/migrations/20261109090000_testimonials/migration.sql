-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL,
    "author_name" VARCHAR(80) NOT NULL,
    "text" VARCHAR(1000) NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "review_date" DATE NOT NULL,
    "photo_url" TEXT,
    "avatar_url" TEXT,
    "product_name" VARCHAR(80),
    "instagram_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "testimonials_is_published_sort_order_idx" ON "testimonials"("is_published", "sort_order");


-- Rating is 1..5 (checked in the database too).
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_rating_check" CHECK ("rating" BETWEEN 1 AND 5);

-- Sample testimonials (is_demo = true): the site marks them as samples until
-- the admin replaces them with real ones in the admin panel.
INSERT INTO "testimonials" ("id", "author_name", "text", "rating", "review_date", "product_name", "is_demo", "sort_order", "updated_at") VALUES
  (gen_random_uuid(), 'Айдана Теребаева', 'Бал абдан даамдуу экен! Табигый даамы дароо билинет. Сөзсүз дагы заказ кылам!', 5, DATE '2026-10-28', 'Бал', true, 1, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Гүлнур Исмаилова', 'Жупка абдан жакты. Жумшак, даамдуу жана сапаты жакшы экен.', 5, DATE '2026-10-24', 'Жупка', true, 2, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Руслан Бектурганов', 'Сары майдын даамы өзгөчө экен. Үйдөгү баарыбызга жакты!', 5, DATE '2026-10-19', 'Сары май', true, 3, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Эльмира Асанова', 'Кымыз свежий, даамы сонун! Дагы алабыз.', 5, DATE '2026-10-15', 'Кымыз', true, 4, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Бакыт Сагынбаев', 'Заказымды тез жеткирип беришти. Продукциялардын сапатына ыраазымын!', 5, DATE '2026-10-11', NULL, true, 5, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Нуржан Абдыкалыков', 'Нават абдан сапаттуу экен. Таңгактоосу да жакты.', 5, DATE '2026-10-06', 'Нават', true, 6, CURRENT_TIMESTAMP);

-- YouTube channel in the contacts block (an existing value is kept).
UPDATE "site_content"
SET "data" = jsonb_build_object('youtube', 'https://youtube.com/@nuskaetno') || COALESCE("data", '{}'::jsonb),
    "updated_at" = CURRENT_TIMESTAMP
WHERE "key" = 'contacts';
