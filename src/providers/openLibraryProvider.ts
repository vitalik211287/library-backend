import type { ProviderBook } from "../types/providerBook.js";
import { uploadBookCover } from "../utils/uploadBookCover.js";

type OpenLibraryBook = {
  title?: string;
  publishers?: string[];
  publish_date?: string;
  number_of_pages?: number;
  covers?: number[];
  languages?: Array<{
    key?: string;
  }>;
  authors?: Array<{
    key?: string;
  }>;
  subjects?: string[];
};

type OpenLibraryAuthor = {
  name?: string;
};

const normalizeIsbn = (value: string) =>
  value.replace(/[^0-9X]/gi, "");

export const getBookFromOpenLibrary = async (
  isbn: string,
): Promise<ProviderBook> => {
  console.log("🌍 OPEN LIBRARY PROVIDER START:", isbn);

  const normalizedIsbn = normalizeIsbn(isbn);

  const response = await fetch(
    `https://openlibrary.org/isbn/${normalizedIsbn}.json`,
    {
      headers: {
        "User-Agent":
          "LibraryApp/1.0 (personal home library application)",
      },
    },
  );

  if (response.status === 404) {
    throw new Error(
      `Book with ISBN ${isbn} not found on Open Library`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Open Library failed: ${response.status}`,
    );
  }

  const data =
    (await response.json()) as OpenLibraryBook;

  if (!data.title) {
    throw new Error(
      `Open Library title missing for ISBN ${isbn}`,
    );
  }

  let author: string | null = null;

  const authorKey = data.authors?.[0]?.key;

  if (authorKey) {
    try {
      const authorResponse = await fetch(
        `https://openlibrary.org${authorKey}.json`,
      );

      if (authorResponse.ok) {
        const authorData =
          (await authorResponse.json()) as OpenLibraryAuthor;

        author = authorData.name ?? null;
      }
    } catch (error) {
      console.error(
        "Open Library author lookup failed:",
        error,
      );
    }
  }

  const publisher =
    data.publishers?.[0] ?? null;

  const yearMatch =
    data.publish_date?.match(/\d{4}/);

  const year = yearMatch
    ? Number(yearMatch[0])
    : null;

  const pages =
    data.number_of_pages ?? null;

  const languageKey =
    data.languages?.[0]?.key ?? null;

  const language =
    languageKey
      ? languageKey.split("/").pop() ?? null
      : null;

  const genre =
    data.subjects?.[0] ?? null;

  let coverUrl: string | null = null;

  if (data.covers?.[0]) {
    const originalCoverUrl =
      `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`;

    try {
      coverUrl = await uploadBookCover(
        originalCoverUrl,
        normalizedIsbn,
      );
    } catch (error) {
      console.error(
        "⚠️ Open Library cover upload failed:",
        error,
      );

      coverUrl = originalCoverUrl;
    }
  }

  return {
    isbn: normalizedIsbn,
    title: data.title,
    author,
    publisher,
    year,
    pages,
    language,
    genre,
    description: null,
    coverUrl,
    sourceUrl:
      `https://openlibrary.org/isbn/${normalizedIsbn}`,
  };
};
