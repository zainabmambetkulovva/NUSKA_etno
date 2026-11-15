-- Product facts shown on the product page (master brief, stage 4). All optional:
-- filled by the company in the admin panel; nothing is invented.
ALTER TABLE "product_translations" ADD COLUMN "shelf_life" TEXT;
ALTER TABLE "product_translations" ADD COLUMN "nutrition" TEXT;
ALTER TABLE "product_translations" ADD COLUMN "origin" TEXT;
ALTER TABLE "product_translations" ADD COLUMN "producer" TEXT;
