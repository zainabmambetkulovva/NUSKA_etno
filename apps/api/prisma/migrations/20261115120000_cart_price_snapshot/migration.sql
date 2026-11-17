-- Price of a product when it was put in the cart, to tell the customer when it changed.
ALTER TABLE "cart_items" ADD COLUMN "price_at_add" INTEGER;
