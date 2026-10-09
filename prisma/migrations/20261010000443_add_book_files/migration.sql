-- CreateEnum
CREATE TYPE "BookFileFormat" AS ENUM ('EPUB', 'FB2', 'PDF');

-- CreateTable
CREATE TABLE "BookFile" (
    "id" TEXT NOT NULL,
    "libraryBookId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "format" "BookFileFormat" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookFile_storageKey_key" ON "BookFile"("storageKey");

-- CreateIndex
CREATE INDEX "BookFile_libraryBookId_idx" ON "BookFile"("libraryBookId");

-- CreateIndex
CREATE INDEX "BookFile_uploadedById_idx" ON "BookFile"("uploadedById");

-- AddForeignKey
ALTER TABLE "BookFile" ADD CONSTRAINT "BookFile_libraryBookId_fkey" FOREIGN KEY ("libraryBookId") REFERENCES "LibraryBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookFile" ADD CONSTRAINT "BookFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
