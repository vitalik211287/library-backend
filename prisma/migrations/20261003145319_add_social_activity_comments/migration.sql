-- AlterTable
ALTER TABLE "SocialPost" ADD COLUMN     "activityId" TEXT;

-- CreateIndex
CREATE INDEX "SocialPost_activityId_createdAt_idx" ON "SocialPost"("activityId", "createdAt");

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "SocialActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
