-- Nullable fields preserve existing reading sessions.
ALTER TABLE "ReadingSession"
  ADD COLUMN "lastHeartbeatAt" TIMESTAMP(3),
  ADD COLUMN "verifiedSeconds" INTEGER,
  ADD COLUMN "readerLeaseId" TEXT;
