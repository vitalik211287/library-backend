ALTER TABLE "LibraryBookEvent"
ADD COLUMN "actorUserId" TEXT;

CREATE INDEX "LibraryBookEvent_actorUserId_occurredAt_idx"
ON "LibraryBookEvent"("actorUserId", "occurredAt");

ALTER TABLE "LibraryBookEvent"
ADD CONSTRAINT "LibraryBookEvent_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;