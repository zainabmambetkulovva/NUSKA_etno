-- AlterTable
ALTER TABLE "users" ADD COLUMN     "google_id" VARCHAR(255),
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");


-- Every account can sign in somehow: with a password or with Google.
ALTER TABLE "users" ADD CONSTRAINT "users_sign_in_method_check" CHECK ("password_hash" IS NOT NULL OR "google_id" IS NOT NULL);
