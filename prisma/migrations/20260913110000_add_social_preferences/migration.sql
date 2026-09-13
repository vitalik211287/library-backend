CREATE TABLE "UserSocialPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "muteNotifications" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserSocialPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSocialPreference_userId_targetUserId_key"
ON "UserSocialPreference"("userId", "targetUserId");

CREATE INDEX "UserSocialPreference_targetUserId_idx"
ON "UserSocialPreference"("targetUserId");

ALTER TABLE "UserSocialPreference"
ADD CONSTRAINT "UserSocialPreference_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "UserSocialPreference"
ADD CONSTRAINT "UserSocialPreference_targetUserId_fkey"
FOREIGN KEY ("targetUserId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;