/*
  Warnings:

  - Made the column `userId` on table `ReadingSession` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ReadingSession" ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "pausedSeconds" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "userId" SET NOT NULL;
