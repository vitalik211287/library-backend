ALTER TABLE "UserSocialPreference"
RENAME COLUMN "muteNotifications" TO "notifyActivity";

UPDATE "UserSocialPreference"
SET "notifyActivity" = NOT "notifyActivity";

ALTER TYPE "NotificationType"
ADD VALUE IF NOT EXISTS 'SOCIAL_ACTIVITY';

DELETE FROM "Notification"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "userId", "actorId", "type", "activityId"
        ORDER BY "createdAt" DESC
      ) AS rn
    FROM "Notification"
    WHERE "activityId" IS NOT NULL
  ) duplicates
  WHERE rn > 1
);

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_activityId_fkey"
FOREIGN KEY ("activityId")
REFERENCES "SocialActivity"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Notification_userId_actorId_type_activityId_key"
ON "Notification"("userId", "actorId", "type", "activityId");