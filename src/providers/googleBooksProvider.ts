import type { ProviderBook } from "../types/providerBook.js";
import { uploadBookCover } from "../utils/uploadBookCover.js";

type GoogleBook = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    language?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type?: string;
      identifier?: string;
    }>;
  };
};

type GoogleBooksResponse = {
  totalItems?: number;
  items?: GoogleBook[];
};

const normalizeIsbn = (value: string) =>
  value.replace(/[^0-9X]/gi, "");

export const getBookFromGoogleBooks = async (
  isbn: string,
): Promise<ProviderBook> => {
  console.log("🌍 GOOGLE BOOKS PROVIDER START:", isbn);

  const normalizedIsbn = normalizeIsbn(isbn);

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  const url = new URL(
    "https://www.googleapis.com/books/v1/volumes",
  );

  url.searchParams.set(
    "q",
    `isbn:${normalizedIsbn}`,
  );

  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Google Books failed: ${response.status}`,
    );
  }

  const data =
    (await response.json()) as GoogleBooksResponse;

  const item = data.items?.[0];
  const info = item?.volumeInfo;

  if (!item || !info?.title) {
    throw new Error(
      `Book with ISBN ${isbn} not found on Google Books`,
    );
  }

  const returnedIsbn =
    info.industryIdentifiers?.find(
      (identifier) =>
        normalizeIsbn(identifier.identifier ?? "") ===
        normalizedIsbn,
    )?.identifier ?? normalizedIsbn;

  const yearMatch =
    info.publishedDate?.match(/\d{4}/);

  const year = yearMatch
    ? Number(yearMatch[0])
    : null;

  let originalCoverUrl =
    info.imageLinks?.thumbnail ??
    info.imageLinks?.smallThumbnail ??
    null;

  if (originalCoverUrl) {
    originalCoverUrl =
      originalCoverUrl
        .replace("http://", "https://")
        .replace("&zoom=1", "&zoom=2");
  }

  let coverUrl: string | null =
    originalCoverUrl;

  if (originalCoverUrl) {
    try {
      coverUrl = await uploadBookCover(
        originalCoverUrl,
        normalizedIsbn,
      );
    } catch (error) {
      console.error(
        "⚠️ Google Books cover upload failed:",
        error,
      );

      coverUrl = originalCoverUrl;
    }
  }

  return {
    isbn: returnedIsbn,
    title: info.title,
    author: info.authors?.join(", ") ?? null,
    publisher: info.publisher ?? null,
    year,
    pages: info.pageCount ?? null,
    language: info.language ?? null,
    genre: info.categories?.[0] ?? null,
    description: info.description ?? null,
    coverUrl,
    sourceUrl:
      `https://books.google.com/books?vid=ISBN${normalizedIsbn}`,
  };
};

