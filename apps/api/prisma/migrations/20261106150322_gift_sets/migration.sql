-- CreateTable
CREATE TABLE "gift_sets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_set_items" (
    "id" UUID NOT NULL,
    "gift_set_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "gift_set_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gift_sets_user_id_created_at_idx" ON "gift_sets"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "gift_set_items_product_id_idx" ON "gift_set_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "gift_set_items_gift_set_id_product_id_key" ON "gift_set_items"("gift_set_id", "product_id");

-- AddForeignKey
ALTER TABLE "gift_sets" ADD CONSTRAINT "gift_sets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_set_items" ADD CONSTRAINT "gift_set_items_gift_set_id_fkey" FOREIGN KEY ("gift_set_id") REFERENCES "gift_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_set_items" ADD CONSTRAINT "gift_set_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data integrity
ALTER TABLE "gift_set_items" ADD CONSTRAINT "gift_set_items_quantity_check" CHECK ("quantity" BETWEEN 1 AND 99);
ALTER TABLE "gift_sets" ADD CONSTRAINT "gift_sets_name_check" CHECK (length(btrim("name")) > 0);
