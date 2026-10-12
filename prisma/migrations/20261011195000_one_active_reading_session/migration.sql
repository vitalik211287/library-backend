-- Prevent concurrent active sessions for the same user and book.
-- Finished sessions remain unrestricted.
-- Migration fails safely if active duplicates already exist.

CREATE UNIQUE INDEX "ReadingSession_one_active_user_book"
ON "ReadingSession" ("userId", "bookId")
WHERE "finishedAt" IS NULL;
