/*
  Warnings:

  - You are about to drop the column `uodatedAt` on the `Fragment` table. All the data in the column will be lost.
  - You are about to drop the column `uodatedAt` on the `Message` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Fragment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Fragment" DROP COLUMN "uodatedAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Message" DROP COLUMN "uodatedAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
