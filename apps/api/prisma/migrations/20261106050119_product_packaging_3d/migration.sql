-- CreateEnum
CREATE TYPE "PackagingModel" AS ENUM ('BOTTLE', 'JAR', 'BOX', 'PACK');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "packaging_3d" "PackagingModel";
