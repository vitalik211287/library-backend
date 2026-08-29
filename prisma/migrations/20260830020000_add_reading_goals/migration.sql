CREATE TABLE "ReadingGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "booksGoal" INTEGER,
    "pagesGoal" INTEGER,
    "minutesGoal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReadingGoal_userId_year_key"
ON "ReadingGoal"("userId", "year");

ALTER TABLE "ReadingGoal"
ADD CONSTRAINT "ReadingGoal_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;