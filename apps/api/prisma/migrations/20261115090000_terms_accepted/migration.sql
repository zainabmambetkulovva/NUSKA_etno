-- When the customer accepted the terms of use (registration, Google sign-up).
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" TIMESTAMP(3);
