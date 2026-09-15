import { lookupBookByIsbnService } from "../modules/books/services/lookupBookByIsbnService.js";

const isbns = [
  "9786177538300",
  "9789664601532",
  "9789664601129",
  "9789663828428",
  "9789663828350",
  "9789663827773",
];

const coreFields = ["title", "author", "publisher"] as const;

const bibliographicFields = [
  "title",
  "author",
  "publisher",
  "year",
  "pages",
  "language",
  "genre",
] as const;

let found = 0;
let coreComplete = 0;
let fullComplete = 0;
let withCover = 0;
let failed = 0;
let local = 0;
let external = 0;

const sourceCounts = new Map<string, number>();

console.log("\nISBN lookup benchmark\n");

for (const isbn of isbns) {
  try {
    const book = await lookupBookByIsbnService(isbn);

    found += 1;

    if (book.source === "local") {
      local += 1;
    } else {
      external += 1;
    }

    sourceCounts.set(book.source, (sourceCounts.get(book.source) ?? 0) + 1);

    const missingCoreFields = coreFields.filter((field) => !book[field]);

    const missingBibliographicFields = bibliographicFields.filter(
      (field) => !book[field],
    );

    if (missingCoreFields.length === 0) {
      coreComplete += 1;
    }

    if (missingBibliographicFields.length === 0) {
      fullComplete += 1;
    }

    if (book.coverUrl) {
      withCover += 1;
    }

    console.log({
      isbn,
      result: "FOUND",
      source: book.source,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      coreMissing: missingCoreFields.join(", ") || "-",
      bibliographicMissing: missingBibliographicFields.join(", ") || "-",
      cover: book.coverUrl ? "YES" : "NO",
    });
  } catch (error) {
    failed += 1;

    console.log({
      isbn,
      result: "FAILED",
      source: "-",
      title: "-",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

const total = isbns.length;

const percent = (value: number) =>
  total === 0 ? 0 : Math.round((value / total) * 100);

console.log("\n========== SUMMARY ==========");
console.log(`Total:         ${total}`);
console.log(`Found:         ${found}/${total} (${percent(found)}%)`);
console.log(
  `Core complete: ${coreComplete}/${total} (${percent(coreComplete)}%)`,
);
console.log(
  `Full complete: ${fullComplete}/${total} (${percent(fullComplete)}%)`,
);
console.log(`With cover:    ${withCover}/${total} (${percent(withCover)}%)`);
console.log(`Local:         ${local}`);
console.log(`External:      ${external}`);
console.log(`Failed:        ${failed}/${total} (${percent(failed)}%)`);

console.log("\n========== SOURCES ==========");

for (const [source, count] of sourceCounts) {
  console.log(`${source}: ${count}`);
}
