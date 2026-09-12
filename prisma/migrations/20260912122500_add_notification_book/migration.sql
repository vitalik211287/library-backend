ALTER TABLE "Notification"
ADD COLUMN "bookId" TEXT;

CREATE INDEX "Notification_bookId_idx"
ON "Notification"("bookId");

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_bookId_fkey"
FOREIGN KEY ("bookId") REFERENCES "Book"("id")
ON DELETE CASCADE ON UPDATE CASCADE;