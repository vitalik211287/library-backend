-- CreateEnum
CREATE TYPE "LibraryBookEventType" AS ENUM ('BOOK_ADDED', 'BOOK_REMOVED');

-- CreateTable
CREATE TABLE "LibraryGoal" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "booksGoal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryBookEvent" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "type" "LibraryBookEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryBookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LibraryGoal_libraryId_idx" ON "LibraryGoal"("libraryId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryGoal_libraryId_year_key" ON "LibraryGoal"("libraryId", "year");

-- CreateIndex
CREATE INDEX "LibraryBookEvent_libraryId_type_occurredAt_idx" ON "LibraryBookEvent"("libraryId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "LibraryBookEvent_bookId_idx" ON "LibraryBookEvent"("bookId");

-- AddForeignKey
ALTER TABLE "LibraryGoal" ADD CONSTRAINT "LibraryGoal_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryBookEvent" ADD CONSTRAINT "LibraryBookEvent_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;
