-- Reset acquisition tracking baseline.
-- Historical BOOK_ADDED events created by the previous backfill
-- are removed so acquisition progress starts from feature rollout.

DELETE FROM "LibraryBookEvent"
WHERE "type" = 'BOOK_ADDED'::"LibraryBookEventType";