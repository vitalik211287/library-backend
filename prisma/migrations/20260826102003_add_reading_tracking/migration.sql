-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('NOT_STARTED', 'READING', 'FINISHED');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "currentPage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "status" "ReadingStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "startPage" INTEGER NOT NULL,
    "endPage" INTEGER,
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
