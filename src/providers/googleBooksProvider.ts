import type { ProviderBook } from "../types/providerBook.js";
import { uploadBookCover } from "../utils/uploadBookCover.js";

type GoogleVolumeInfo = {
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

type GoogleBook = {
  id?: string;
  volumeInfo?: GoogleVolumeInfo;
};

type GoogleBooksResponse = {
  totalItems?: number;
  items?: GoogleBook[];
};

const normalizeIsbn = (value: string) => value.replace(/[^0-9X]/gi, "");

const getYear = (publishedDate?: string): number | null => {
  const match = publishedDate?.match(/\d{4}/);

  return match ? Number(match[0]) : null;
};

const getCover = (info?: GoogleVolumeInfo): string | null => {
  let url =
    info?.imageLinks?.thumbnail ?? info?.imageLinks?.smallThumbnail ?? null;

  if (!url) {
    return null;
  }

  url = url.replace("http://", "https://").replace("&zoom=1", "&zoom=2");

  return url;
};

const scoreBook = (book: GoogleBook) => {
  const info = book.volumeInfo;

  if (!info?.title) {
    return -1;
  }

  let score = 0;

  if (info.authors?.length) score += 3;
  if (info.publisher) score += 2;
  if ((info.pageCount ?? 0) > 0) score += 3;
  if (info.description) score += 2;
  if (info.categories?.length) score += 2;
  if (getCover(info)) score += 3;
  if (info.language) score += 1;

  return score;
};

const searchGoogleBooks = async (
  query: string,
  apiKey?: string,
): Promise<GoogleBook[]> => {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");

  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "10");

  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Google Books failed: ${response.status}`);
  }

  const data = (await response.json()) as GoogleBooksResponse;

  return data.items ?? [];
};

const pickBestBook = (books: GoogleBook[]): GoogleBook | null => {
  return [...books].sort((a, b) => scoreBook(b) - scoreBook(a))[0] ?? null;
};

export const getBookFromGoogleBooks = async (
  isbn: string,
): Promise<ProviderBook> => {
  console.log("🌍 GOOGLE BOOKS PROVIDER START:", isbn);

  const normalizedIsbn = normalizeIsbn(isbn);

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  const isbnResults = await searchGoogleBooks(`isbn:${normalizedIsbn}`, apiKey);

  const isbnBook = pickBestBook(isbnResults);

  const isbnInfo = isbnBook?.volumeInfo;

  if (!isbnInfo?.title) {
    throw new Error(`Book with ISBN ${isbn} not found on Google Books`);
  }

  let enrichmentBook: GoogleBook | null = null;

  const author = isbnInfo.authors?.[0];

  const needsEnrichment =
    !isbnInfo.publisher ||
    !isbnInfo.pageCount ||
    isbnInfo.pageCount <= 0 ||
    !isbnInfo.imageLinks ||
    !isbnInfo.categories?.length;

  if (needsEnrichment) {
    const queryParts = [`intitle:"${isbnInfo.title}"`];

    if (author) {
      queryParts.push(`inauthor:"${author}"`);
    }

    try {
      const enrichmentResults = await searchGoogleBooks(
        queryParts.join(" "),
        apiKey,
      );

      enrichmentBook = pickBestBook(enrichmentResults);

      console.log(
        "🧩 GOOGLE BOOKS ENRICHMENT:",
        enrichmentBook?.id ?? "not found",
      );
    } catch (error) {
      console.error("⚠️ Google Books enrichment failed:", error);
    }
  }

  const extraInfo = enrichmentBook?.volumeInfo;

  const finalPublisher = isbnInfo.publisher ?? extraInfo?.publisher ?? null;

  const finalPages =
    isbnInfo.pageCount && isbnInfo.pageCount > 0
      ? isbnInfo.pageCount
      : extraInfo?.pageCount && extraInfo.pageCount > 0
        ? extraInfo.pageCount
        : null;

  const finalDescription =
    isbnInfo.description ?? extraInfo?.description ?? null;

  const finalLanguage = isbnInfo.language ?? extraInfo?.language ?? null;

  const finalGenre =
    extraInfo?.categories?.[0] ?? isbnInfo.categories?.[0] ?? null;

  const originalCoverUrl = getCover(isbnInfo) ?? getCover(extraInfo);

  let coverUrl = originalCoverUrl;

  if (originalCoverUrl) {
    try {
      coverUrl = await uploadBookCover(originalCoverUrl, normalizedIsbn);
    } catch (error) {
      console.error("⚠️ Google Books cover upload failed:", error);
    }
  }

  const returnedIsbn =
    isbnInfo.industryIdentifiers?.find(
      (identifier) =>
        normalizeIsbn(identifier.identifier ?? "") === normalizedIsbn,
    )?.identifier ?? normalizedIsbn;

  const year =
    getYear(isbnInfo.publishedDate) ?? getYear(extraInfo?.publishedDate);

  const sourceId = isbnBook?.id ?? enrichmentBook?.id;

  return {
    isbn: returnedIsbn,
    title: isbnInfo.title,
    author:
      isbnInfo.authors?.join(", ") ?? extraInfo?.authors?.join(", ") ?? null,
    publisher: finalPublisher,
    year,
    pages: finalPages,
    language: finalLanguage,
    genre: finalGenre,
    description: finalDescription,
    coverUrl,
    sourceUrl: sourceId
      ? `https://books.google.com/books?id=${sourceId}`
      : `https://books.google.com/books?vid=ISBN${normalizedIsbn}`,
  };
};
