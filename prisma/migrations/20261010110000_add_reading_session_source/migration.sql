-- Existing sessions remain NULL: their origin cannot be inferred safely.
CREATE TYPE "ReadingSessionSource" AS ENUM ('MANUAL', 'EBOOK');
ALTER TABLE "ReadingSession" ADD COLUMN "source" "ReadingSessionSource";
