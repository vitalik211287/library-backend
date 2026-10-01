-- CreateTable
CREATE TABLE "PostKudos" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostKudos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostKudos_postId_idx" ON "PostKudos"("postId");

-- CreateIndex
CREATE INDEX "PostKudos_userId_idx" ON "PostKudos"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostKudos_postId_userId_key" ON "PostKudos"("postId", "userId");

-- AddForeignKey
ALTER TABLE "PostKudos" ADD CONSTRAINT "PostKudos_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostKudos" ADD CONSTRAINT "PostKudos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
