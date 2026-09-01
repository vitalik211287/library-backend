/*
  Warnings:

  - You are about to drop the column `currentPage` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Book` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Book" DROP COLUMN "currentPage",
DROP COLUMN "rating",
DROP COLUMN "status";
