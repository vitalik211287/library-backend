import prisma from "../utils/prisma.js";

type GenreStats = {
  genre: string;
  count: number;
  examples: string[];
};

const main = async () => {
  console.log("UNTAGGED BOOK GENRES ANALYSIS");
  console.log("Database will NOT be modified.\n");

  const books = await prisma.book.findMany({
    where: {
      tags: {
        isEmpty: true,
      },
    },
    select: {
      title: true,
      genre: true,
    },
  });

  const genres = new Map<string, GenreStats>();

  for (const book of books) {
    const genre = book.genre?.trim() || "(без жанру)";

    const existing = genres.get(genre);

    if (existing) {
      existing.count += 1;

      if (existing.examples.length < 3) {
        existing.examples.push(book.title);
      }

      continue;
    }

    genres.set(genre, {
      genre,
      count: 1,
      examples: [book.title],
    });
  }

  const sortedGenres = Array.from(genres.values()).sort(
    (a, b) => b.count - a.count,
  );

  for (const item of sortedGenres) {
    console.log("----------------------------------------");
    console.log(`GENRE: ${item.genre}`);
    console.log(`BOOKS: ${item.count}`);
    console.log(`EXAMPLES:`);

    for (const title of item.examples) {
      console.log(`  - ${title}`);
    }
  }

  console.log("\n========== SUMMARY ==========");
  console.log(`Untagged books:  ${books.length}`);
  console.log(`Unique genres:   ${sortedGenres.length}`);
};

main()
  .catch((error) => {
    console.error("UNTAGGED GENRES ANALYSIS FAILED:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
