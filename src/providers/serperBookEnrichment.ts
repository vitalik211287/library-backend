import type { ProviderBook } from "../types/providerBook.js";

type SerperOrganicResult = {
  title?: string;
  link?: string;
  snippet?: string;
};

type SerperResponse = {
  organic?: SerperOrganicResult[];
};

type EnrichmentOptions = {
  overrideEditionFields?: boolean;
};

const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim();

const normalizeIsbn = (value: string) => value.replace(/[^0-9X]/gi, "");

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
    /(?:Рік видання|Рік|Видано|Дата видання|Год издания|Date de parution)\s*[:.\-]?\s*(?:(\d{1,2})[./-](\d{1,2})[./-])?(20\d{2}|19\d{2})/i,
  );

  const value = match?.[3] ?? match?.[1];

  return value ? Number(value) : null;
};

const parsePages = (text: string): number | null => {
  const patterns = [
    /(?:Кількість сторінок|Сторінок|Сторінки|Количество страниц|Страниц|Pages)\s*[:.\-]?\s*(\d{2,4})/i,
    /Page Count\s*[:.\-]?\s*(\d{2,4})/i,
    /(\d{2,4})\s*pages\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return Number(match[1]);
    }
  }

  return null;
};

const parsePublisher = (text: string): string | null =>
  firstMatch(text, [
    /Видавництво\s*[:.\-–—]?\s*([^|.;]+)/i,
    /Видавець\s*[:.\-–—]?\s*([^|.;]+)/i,
    /Издательство\s*[:.\-–—]?\s*([^|.;]+)/i,
    /издательство\s+([^|.;]+)/i,
    /Производитель\s*[:.\-–—]?\s*([^|.;]+)/i,
    /Publisher\s*[:.\-–—]?\s*([^|.;]+)/i,
  ]);

const parseGenre = (text: string): string | null =>
  firstMatch(text, [
    /Жанр\s*[:.\-–—]?\s*([^|.;]+)/i,
    /Классификация\s*[:.\-–—]?\s*([^|.;]+)/i,
    /Категория\s*[:.\-–—]?\s*([^|.;]+)/i,
    /Genre\s*[:.\-–—]?\s*([^|.;]+)/i,
  ]);

const containsExactIsbn = (text: string, isbn: string) =>
  normalizeIsbn(text).includes(normalizeIsbn(isbn));

export const enrichBookViaSerper = async (
  book: ProviderBook,
  options: EnrichmentOptions = {},
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
      q: `"${book.isbn}"`,
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

  let author = book.author;
  let publisher = book.publisher;
  let year = book.year;
  let pages = book.pages && book.pages > 0 ? book.pages : null;
  let language = book.language;
  let genre = book.genre;

  let publisherOverridden = false;
  let yearOverridden = false;
  let pagesOverridden = false;
  let genreOverridden = false;

  for (const item of data.organic ?? []) {
    const text = normalizeText(
      [item.title, item.snippet].filter(Boolean).join(" "),
    );

    if (!containsExactIsbn(text, book.isbn)) {
      continue;
    }

    if (!author) {
      author = firstMatch(text, [
        /Автор\s*[:.\-–—]?\s*([^|.;]+)/i,
        /автор\s*[–—-]\s*([^,.;]+)/i,
        /от автора\s+([^|.;]+)/i,
        /Author\s*[:.\-–—]?\s*([^|.;]+)/i,
      ]);
    }

    const foundPublisher = parsePublisher(text);

    if (
      foundPublisher &&
      (!publisher || (options.overrideEditionFields && !publisherOverridden))
    ) {
      publisher = foundPublisher;
      publisherOverridden = true;
    }

    const foundYear = parseYear(text);

    if (
      foundYear &&
      (!year || (options.overrideEditionFields && !yearOverridden))
    ) {
      year = foundYear;
      yearOverridden = true;
    }

    const foundPages = parsePages(text);

    if (
      foundPages &&
      (!pages || (options.overrideEditionFields && !pagesOverridden))
    ) {
      pages = foundPages;
      pagesOverridden = true;
    }

    if (!language) {
      language = firstMatch(text, [
        /Мова\s*[:.\-–—]?\s*([^|.;]+)/i,
        /Мова видання\s*[:.\-–—]?\s*([^|.;]+)/i,
        /Язык\s*[:.\-–—]?\s*([^|.;]+)/i,
        /на\s+([А-ЯA-Z][^|.;]+?)\s+языке/i,
        /Language\s*[:.\-–—]?\s*([^|.;]+)/i,
      ]);
    }

    const foundGenre = parseGenre(text);

    if (
      foundGenre &&
      (!genre || (options.overrideEditionFields && !genreOverridden))
    ) {
      genre = foundGenre;
      genreOverridden = true;
    }
  }

  const cleanPublisher =
    publisher
      ?.replace(
        /\s*[?|]?\s*ISBN\b.*$/i,
        "",
      )
      .replace(/\s*▻\s*$/,"").trim() ?? null;

  return {
    ...book,
    author,
    publisher: cleanPublisher,
    year,
    pages,
    language,
    genre,
  };
};



