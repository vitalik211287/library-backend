import * as cheerio from "cheerio";
import iconv from "iconv-lite";

import type { ProviderBook } from "../types/providerBook.js";

const PRICE_LIST_URL = "https://www.book-plus.com.ua/pricelist.php";

const normalizeIsbn = (value: string) => value.replace(/[^0-9X]/gi, "");

const cleanText = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const cleaned = value.replace(/\s+/g, " ").trim();

  return cleaned || null;
};

const parseNumber = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }

  const match = value.match(/\d+/);

  return match ? Number(match[0]) : null;
};

export const getBookFromBookPlus = async (
  isbn: string,
): Promise<ProviderBook> => {
  const normalizedIsbn = normalizeIsbn(isbn);

  console.log("BOOK PLUS START:", normalizedIsbn);

  const response = await fetch(PRICE_LIST_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; LibraryBookResolver/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Book Plus request failed: ${response.status}`);
  }

  // Book Plus uses Windows-1251 instead of UTF-8.
  const buffer = Buffer.from(await response.arrayBuffer());
  const html = iconv.decode(buffer, "windows-1251");

  const $ = cheerio.load(html);

  let result: ProviderBook | null = null;

  $("tr").each((_, element) => {
    if (result) {
      return false;
    }

    const row = $(element);
    const rowText = cleanText(row.text());

    if (!rowText || !normalizeIsbn(rowText).includes(normalizedIsbn)) {
      return;
    }

    const cells = row
      .find("td")
      .map((__, cell) => cleanText($(cell).text()))
      .get()
      .filter((value): value is string => Boolean(value));

    const isbnCellIndex = cells.findIndex((cell) =>
      normalizeIsbn(cell).includes(normalizedIsbn),
    );

    if (isbnCellIndex !== 0 || cells.length < 5) {
      return;
    }

    /*
     * Book Plus price-list columns:
     * 0 - ISBN
     * 1 - title
     * 2 - author
     * 3 - pages
     * 4 - year
     * 5 - binding
     * 6 - price
     */
    const title = cells[1] ?? null;
    const author = cells[2] ?? null;
    const pages = parseNumber(cells[3]);
    const year = parseNumber(cells[4]);

    if (!title) {
      return;
    }

    result = {
      isbn: normalizedIsbn,
      title,
      author,
      publisher: "Книга-плюс",
      year,
      pages,
      language: null,
      genre: null,
      description: null,
      coverUrl: null,
      sourceUrl: PRICE_LIST_URL,
    };

    return false;
  });

  const foundBook = result as ProviderBook | null;

  if (!foundBook) {
    throw new Error(`Book with ISBN ${normalizedIsbn} not found in Book Plus`);
  }

  console.log("BOOK PLUS FOUND:", foundBook.title);

  return foundBook;
};
