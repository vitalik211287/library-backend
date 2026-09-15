import prisma from "../utils/prisma.js";
import { classifyBookMetadata } from "../utils/bookMetadataClassifier.js";

const APPLY = process.argv.includes("--apply");

const main = async () => {
  console.log(
    APPLY ? "BOOK TAGS BACKFILL — APPLY MODE" : "BOOK TAGS BACKFILL — DRY RUN",
  );

  console.log(
    APPLY ? "Database WILL be modified.\n" : "Database will NOT be modified.\n",
  );

  const books = await prisma.book.findMany({
    select: {
      id: true,
      isbn: true,
      title: true,
      author: true,
      genre: true,
      description: true,
      tags: true,
    },
    orderBy: {
      title: "asc",
    },
  });

  let wouldChange = 0;
  let updated = 0;
  let alreadyTagged = 0;
  let withoutGeneratedTags = 0;

  for (const book of books) {
    const currentTags: string[] = Array.isArray(book.tags)
      ? [...book.tags]
      : [];

    // Не чіпаємо книги, які вже мають теги.
    if (currentTags.length > 0) {
      alreadyTagged += 1;
      continue;
    }

    const generatedTags = classifyBookMetadata({
      title: book.title,
      author: book.author,
      genre: book.genre,
      description: book.description,
    });

    if (generatedTags.length === 0) {
      withoutGeneratedTags += 1;
      continue;
    }

    wouldChange += 1;

    console.log("----------------------------------------");
    console.log(`TITLE: ${book.title}`);
    console.log(`ISBN:  ${book.isbn ?? "-"}`);
    console.log(`GENRE: ${book.genre ?? "-"}`);
    console.log("OLD:   []");
    console.log(`NEW:   ${generatedTags.join(", ")}`);

    if (APPLY) {
      await prisma.book.update({
        where: {
          id: book.id,
        },
        data: {
          tags: generatedTags,
        },
      });

      updated += 1;
    }
  }

  console.log("\n========== SUMMARY ==========");
  console.log(`Total books:             ${books.length}`);
  console.log(`Already tagged:          ${alreadyTagged}`);
  console.log(`Would change:            ${wouldChange}`);
  console.log(`Without generated tags:  ${withoutGeneratedTags}`);

  if (APPLY) {
    console.log(`Updated:                  ${updated}`);
  } else {
    console.log("\nDRY RUN ONLY — nothing was written.");
  }
};

main()
  .catch((error) => {
    console.error("BOOK TAGS BACKFILL FAILED:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
