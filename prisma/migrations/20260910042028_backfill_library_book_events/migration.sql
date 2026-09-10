-- Backfill historical BOOK_ADDED events for books already present in libraries.
-- Preserve the original LibraryBook.addedAt timestamp.

INSERT INTO "LibraryBookEvent" (
  "id",
  "libraryId",
  "bookId",
  "type",
  "occurredAt"
)
SELECT
  gen_random_uuid(),
  lb."libraryId",
  lb."bookId",
  'BOOK_ADDED'::"LibraryBookEventType",
  lb."addedAt"
FROM "LibraryBook" lb
WHERE NOT EXISTS (
  SELECT 1
  FROM "LibraryBookEvent" e
  WHERE e."libraryId" = lb."libraryId"
    AND e."bookId" = lb."bookId"
    AND e."type" = 'BOOK_ADDED'::"LibraryBookEventType"
);
