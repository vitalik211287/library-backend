-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "currentPage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "status" "ReadingStatus" NOT NULL DEFAULT 'NOT_STARTED';
