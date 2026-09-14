import type { ProviderBook } from "../types/providerBook.js";

type SerperOrganicResult = {
  title?: string;
  link?: string;
  snippet?: string;
};

type SerperResponse = {
  organic?: SerperOrganicResult[];
};

const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim();

const firstMatch = (text: string, patterns: RegExp[]): string | null => {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return normalizeText(match[1]);
    }
  }

  return null;
};

const parseYear = (text: string): number | null => {
  const match = text.match(
    /(?:Рік видання|Рік|Видано)\s*[:.\-]?\s*(20\d{2}|19\d{2})/i,
  );

  return match?.[1] ? Number(match[1]) : null;
};

const parsePages = (text: string): number | null => {
  const match = text.match(
    /(?:Кількість сторінок|Сторінок|Сторінки)\s*[:.\-]?\s*(\d{2,4})/i,
  );

  return match?.[1] ? Number(match[1]) : null;
};

export const enrichBookViaSerper = async (
  book: ProviderBook,
): Promise<ProviderBook> => {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    return book;
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: `"${book.title}" "${book.isbn}"`,
      gl: "ua",
      hl: "uk",
      num: 10,
    }),
  });

  if (!response.ok) {
    console.log(`⚪ Serper enrichment failed: ${response.status}`);

    return book;
  }

  const data = (await response.json()) as SerperResponse;

  const texts =
    data.organic
      ?.map((item) => [item.title, item.snippet].filter(Boolean).join(" "))
      .filter(Boolean) ?? [];

  let author = book.author;
  let publisher = book.publisher;
  let year = book.year;
  let pages = book.pages;
  let language = book.language;

  for (const text of texts) {
    if (!author) {
      author = firstMatch(text, [
        /Автор\s*[:.\-–—]?\s*([^|.;]+)/i,
        /автор\s*[–—-]\s*([^,.;]+)/i,
      ]);
    }

    if (!publisher) {
      publisher = firstMatch(text, [
        /Видавництво\s*[:.\-–—]?\s*([^|.;]+)/i,
        /Видавець\s*[:.\-–—]?\s*([^|.;]+)/i,
      ]);
    }

    if (!year) {
      year = parseYear(text);
    }

    if (!pages) {
      pages = parsePages(text);
    }

    if (!language) {
      language = firstMatch(text, [
        /Мова\s*[:.\-–—]?\s*([^|.;]+)/i,
        /Мова видання\s*[:.\-–—]?\s*([^|.;]+)/i,
      ]);
    }
  }

  return {
    ...book,
    author,
    publisher,
    year,
    pages,
    language,
  };
};
