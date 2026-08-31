-- CreateEnum
CREATE TYPE "ProgressMode" AS ENUM ('PAGES', 'PERCENT');

-- AlterEnum
ALTER TYPE "ReadingStatus" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "ReadingSession" ADD COLUMN     "endPercent" INTEGER,
ADD COLUMN     "progressMode" "ProgressMode" NOT NULL DEFAULT 'PAGES',
ADD COLUMN     "startPercent" INTEGER;

-- AlterTable
ALTER TABLE "UserBook" ADD COLUMN     "currentPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progressMode" "ProgressMode" NOT NULL DEFAULT 'PAGES';
