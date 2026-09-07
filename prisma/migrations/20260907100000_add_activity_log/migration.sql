CREATE TYPE "ActivityType" AS ENUM (
  'STATUS_CHANGED',
  'PROGRESS_CHANGED',
  'PROGRESS_RESET',
  'RATING_CHANGED',
  'WISHLIST_CHANGED'
);

CREATE TABLE "ActivityLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookId" TEXT,
  "type" "ActivityType" NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityLog_userId_createdAt_idx"
ON "ActivityLog"("userId", "createdAt");

CREATE INDEX "ActivityLog_bookId_createdAt_idx"
ON "ActivityLog"("bookId", "createdAt");

ALTER TABLE "ActivityLog"
ADD CONSTRAINT "ActivityLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ActivityLog"
ADD CONSTRAINT "ActivityLog_bookId_fkey"
FOREIGN KEY ("bookId") REFERENCES "Book"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
