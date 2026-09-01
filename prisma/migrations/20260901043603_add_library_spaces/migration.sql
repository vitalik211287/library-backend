-- CreateEnum
CREATE TYPE "LibraryRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "Library" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryMember" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "LibraryRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryBook" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryBook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LibraryMember_libraryId_idx" ON "LibraryMember"("libraryId");

-- CreateIndex
CREATE INDEX "LibraryMember_userId_idx" ON "LibraryMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryMember_libraryId_userId_key" ON "LibraryMember"("libraryId", "userId");

-- CreateIndex
CREATE INDEX "LibraryBook_libraryId_idx" ON "LibraryBook"("libraryId");

-- CreateIndex
CREATE INDEX "LibraryBook_bookId_idx" ON "LibraryBook"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryBook_libraryId_bookId_key" ON "LibraryBook"("libraryId", "bookId");

-- AddForeignKey
ALTER TABLE "LibraryMember" ADD CONSTRAINT "LibraryMember_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryMember" ADD CONSTRAINT "LibraryMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryBook" ADD CONSTRAINT "LibraryBook_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryBook" ADD CONSTRAINT "LibraryBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
