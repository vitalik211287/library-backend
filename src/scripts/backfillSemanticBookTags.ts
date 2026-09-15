import prisma from "../utils/prisma.js";
import { enrichBookMetadata } from "../modules/books/services/bookMetadataEnrichmentService.js";

const APPLY = process.argv.includes("--apply");

const main = async () => {
  console.log(
    APPLY
      ? "AI SEMANTIC TAGS BACKFILL — APPLY MODE"
      : "AI SEMANTIC TAGS BACKFILL — DRY RUN",
  );

  if (!APPLY) {
    console.log("Database will NOT be modified.");
  }

  const books = await prisma.book.findMany({
    where: {
      title: {
        not: "Тестова книга",
      },
    },
    select: {
      id: true,
      isbn: true,
      title: true,
      author: true,
      genre: true,
      description: true,
      tags: true,
    },
  });

  let processed = 0;
  let wouldChange = 0;
  let updated = 0;
  let stillWithoutTags = 0;

  console.log(`\nBooks selected for AI enrichment: ${books.length}\n`);

  for (const book of books) {
    processed += 1;

    console.log("----------------------------------------");
    console.log(`TITLE: ${book.title}`);
    console.log(`AUTHOR: ${book.author ?? "—"}`);
    console.log(`ISBN: ${book.isbn ?? "—"}`);
    console.log(`GENRE: ${book.genre ?? "—"}`);

    const enrichment = await enrichBookMetadata({
      title: book.title,
      ...(book.author !== undefined ? { author: book.author } : {}),
      ...(book.genre !== undefined ? { genre: book.genre } : {}),
      ...(book.description !== undefined
        ? { description: book.description }
        : {}),
      tags: book.tags,
    });

    console.log(`AI TAGS: ${enrichment.semanticTags.join(", ") || "—"}`);
    console.log(`FINAL: ${enrichment.tags.join(", ") || "—"}`);

    if (enrichment.tags.length === 0) {
      stillWithoutTags += 1;
      continue;
    }

    wouldChange += 1;

    if (APPLY) {
      await prisma.book.update({
        where: {
          id: book.id,
        },
        data: {
          tags: enrichment.tags,
        },
      });

      updated += 1;
    }
  }

  console.log("\n========== SUMMARY ==========");
  console.log(`Processed:          ${processed}`);
  console.log(`Would change:       ${wouldChange}`);
  console.log(`Still without tags: ${stillWithoutTags}`);
  console.log(`Updated:            ${updated}`);
};

main()
  .catch((error) => {
    console.error("AI semantic tags backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
