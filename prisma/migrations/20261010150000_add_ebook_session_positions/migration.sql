-- EPUB reading location is independent of the cumulative progress metrics.
ALTER TABLE "ReadingSession"
  ADD COLUMN "epubStartPositionPercent" INTEGER,
  ADD COLUMN "epubEndPositionPercent" INTEGER;
