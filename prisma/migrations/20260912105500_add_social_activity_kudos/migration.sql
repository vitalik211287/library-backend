CREATE TYPE "SocialActivityType" AS ENUM (
  'ACHIEVEMENT_UNLOCKED',
  'BOOK_FINISHED'
);

CREATE TABLE "SocialActivity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "SocialActivityType" NOT NULL,
  "achievementId" TEXT,
  "bookId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SocialActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityKudos" (
  "id" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ActivityKudos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialActivity_userId_type_achievementId_key"
ON "SocialActivity"("userId", "type", "achievementId");

CREATE INDEX "SocialActivity_userId_createdAt_idx"
ON "SocialActivity"("userId", "createdAt");

CREATE INDEX "SocialActivity_type_createdAt_idx"
ON "SocialActivity"("type", "createdAt");

CREATE INDEX "SocialActivity_bookId_idx"
ON "SocialActivity"("bookId");

CREATE UNIQUE INDEX "ActivityKudos_activityId_userId_key"
ON "ActivityKudos"("activityId", "userId");

CREATE INDEX "ActivityKudos_activityId_idx"
ON "ActivityKudos"("activityId");

CREATE INDEX "ActivityKudos_userId_idx"
ON "ActivityKudos"("userId");

ALTER TABLE "SocialActivity"
ADD CONSTRAINT "SocialActivity_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ActivityKudos"
ADD CONSTRAINT "ActivityKudos_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "SocialActivity"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ActivityKudos"
ADD CONSTRAINT "ActivityKudos_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;