import { lookupBookByIsbnService } from "../modules/books/services/lookupBookByIsbnService.js";

const isbns = [
  "9786175232101",
  "9786171513150",
  "9786176797203",
  "9786176798323",
  "9786176792222",
  "9786176798552",
  "9786176797012",
  "9786176797760",
  "9786170960740",
  "9786178120610",
  "9786178437633",
  "9786175519417",
  "9786176147176",
  "9789661068772",
];

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
let complete = 0;
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

    sourceCounts.set(
      book.source,
      (sourceCounts.get(book.source) ?? 0) + 1,
    );

    const missingFields = bibliographicFields.filter(
      (field) => !book[field],
    );

    if (missingFields.length === 0) {
      complete += 1;
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
      bibliographicMissing: missingFields.join(", ") || "-",
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
console.log(`Total:        ${total}`);
console.log(`Found:        ${found}/${total} (${percent(found)}%)`);
console.log(`Complete:     ${complete}/${total} (${percent(complete)}%)`);
console.log(`With cover:   ${withCover}/${total} (${percent(withCover)}%)`);
console.log(`Local:        ${local}`);
console.log(`External:     ${external}`);
console.log(`Failed:       ${failed}/${total} (${percent(failed)}%)`);

console.log("\n========== SOURCES ==========");

for (const [source, count] of sourceCounts) {
  console.log(`${source}: ${count}`);
}
