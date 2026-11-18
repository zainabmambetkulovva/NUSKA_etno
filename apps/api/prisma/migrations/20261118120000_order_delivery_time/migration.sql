-- The customer may say when the delivery suits them (free text, optional).
ALTER TABLE "orders" ADD COLUMN "delivery_time" VARCHAR(100);
