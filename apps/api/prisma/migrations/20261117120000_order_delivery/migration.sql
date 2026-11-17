-- Orders can be delivered to an address (the shop works by delivery); pickup stays possible.
CREATE TYPE "DeliveryMethod" AS ENUM ('DELIVERY', 'PICKUP');

ALTER TABLE "orders"
  ADD COLUMN "delivery_method" "DeliveryMethod" NOT NULL DEFAULT 'PICKUP',
  ADD COLUMN "delivery_city" VARCHAR(100),
  ADD COLUMN "delivery_address" VARCHAR(500),
  ADD COLUMN "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  ALTER COLUMN "pickup_location_id" DROP NOT NULL,
  ALTER COLUMN "pickup_location_name" DROP NOT NULL,
  ALTER COLUMN "pickup_location_address" DROP NOT NULL;

-- Every order says where it goes: an address for delivery, a pickup point for pickup.
ALTER TABLE "orders" ADD CONSTRAINT "orders_destination_check" CHECK (
  ("delivery_method" = 'DELIVERY' AND "delivery_city" IS NOT NULL AND "delivery_address" IS NOT NULL)
  OR ("delivery_method" = 'PICKUP' AND "pickup_location_id" IS NOT NULL)
);
