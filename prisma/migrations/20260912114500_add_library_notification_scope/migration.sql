CREATE TYPE "NotificationScope" AS ENUM (
  'USER',
  'LIBRARY'
);

ALTER TYPE "NotificationType"
ADD VALUE IF NOT EXISTS 'LIBRARY_BOOK_ADDED';

ALTER TABLE "Notification"
ADD COLUMN "scope" "NotificationScope" NOT NULL DEFAULT 'USER',
ADD COLUMN "libraryId" TEXT;

CREATE INDEX "Notification_libraryId_createdAt_idx"
ON "Notification"("libraryId", "createdAt");

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_libraryId_fkey"
FOREIGN KEY ("libraryId") REFERENCES "Library"("id")
ON DELETE CASCADE ON UPDATE CASCADE;