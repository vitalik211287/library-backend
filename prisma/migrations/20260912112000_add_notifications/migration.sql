CREATE TYPE "NotificationType" AS ENUM (
  'KUDOS_RECEIVED',
  'NEW_FOLLOWER'
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "activityId" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_isRead_createdAt_idx"
ON "Notification"("userId", "isRead", "createdAt");

CREATE INDEX "Notification_actorId_createdAt_idx"
ON "Notification"("actorId", "createdAt");

CREATE INDEX "Notification_activityId_idx"
ON "Notification"("activityId");

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;