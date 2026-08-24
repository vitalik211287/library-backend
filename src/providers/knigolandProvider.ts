import * as cheerio from "cheerio";

const SEARCH_URL = "https://api.multisearch.io/";

type SearchBook = {
  name: string;
  picture?: string;
  url?: string;
  brand?: string;
};

type SearchGroup = {
  items?: SearchBook[];
};

type SearchResponse = {
  results?: {
    items?: SearchGroup[];
  };
};

const getCharacteristicValue = (
  $: cheerio.CheerioAPI,
  label: string,
): string | null => {
  let value: string | null = null;

  $("body *").each((_, element) => {
    const text = $(element).text().trim();

    if (text !== label) {
      return;
    }

    const nextText = $(element)
      .next()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (nextText) {
      value = nextText;
      return false;
    }
  });

  return value;
};

export const getBookFromKnigoland = async (isbn: string) => {
  // 1. Шукаємо книгу за ISBN
  const params = new URLSearchParams({
    id: "12313",
    uid: "2e611a79-8553-4ea1-adea-0052b39aa0f0",
    key: "cfa8663ef0b1900623ad65298bd7b895",
    autocomplete: "true",
    group: "true",
    query: isbn,
    limit: "20",
    lang: "uk",
  });

  const searchResponse = await fetch(
    `${SEARCH_URL}?${params.toString()}`,
  );

  if (!searchResponse.ok) {
    throw new Error(
      `Knigoland search failed: ${searchResponse.status}`,
    );
  }

  const searchData =
    (await searchResponse.json()) as SearchResponse;

  const firstGroup = searchData.results?.items?.[0];
  const firstBook = firstGroup?.items?.[0];

  if (!firstBook) {
    throw new Error(
      `Book with ISBN ${isbn} not found on Knigoland`,
    );
  }

  if (!firstBook.url) {
    throw new Error(
      `Knigoland book page URL is missing for ISBN ${isbn}`,
    );
  }

  // 2. Відкриваємо сторінку самої книги
  const pageUrl = new URL(firstBook.url);

  // Прибираємо ?q=ISBN та інші query-параметри
  pageUrl.search = "";

  const pageResponse = await fetch(pageUrl);

  if (!pageResponse.ok) {
    throw new Error(
      `Knigoland book page failed: ${pageResponse.status}`,
    );
  }

  const html = await pageResponse.text();
  const $ = cheerio.load(html);

  // 3. Характеристики
  const pageIsbn = getCharacteristicValue($, "ISBN");

  const publisher =
    getCharacteristicValue($, "Видавництво") ??
    firstBook.brand ??
    null;

  const yearText =
    getCharacteristicValue($, "Рік видання");

  const pagesText =
    getCharacteristicValue($, "Сторінки");

  const language =
    getCharacteristicValue($, "Мова перекладу") ??
    getCharacteristicValue($, "Мова");

  const year = yearText
    ? Number(yearText)
    : null;

  const pages = pagesText
    ? Number(pagesText)
    : null;

  // 4. Опис
  let description: string | null = null;

  $("h2").each((_, element) => {
    const heading = $(element).text().trim();

    if (!heading.startsWith("Про книжку")) {
      return;
    }

    const descriptionParts: string[] = [];

    let current = $(element).next();

    while (
      current.length &&
      !current.is("h2") &&
      !current
        .text()
        .trim()
        .startsWith("Характеристики")
    ) {
      const text = current
        .text()
        .replace(/\s+/g, " ")
        .trim();

      if (text && text !== "Показати ще") {
        descriptionParts.push(text);
      }

      current = current.next();
    }

    if (descriptionParts.length > 0) {
      description = descriptionParts
        .join(" ")
        .replace(/Показати ще\s*$/i, "")
        .trim();
    }

    return false;
  });

  // 5. Повертаємо книгу
  return {
    isbn: pageIsbn ?? isbn,
    title: firstBook.name,
    author: null,
    publisher,
    year:
      year !== null && !Number.isNaN(year)
        ? year
        : null,
    pages:
      pages !== null && !Number.isNaN(pages)
        ? pages
        : null,
    language: language ?? null,
    genre: null,
    description,
    coverUrl: firstBook.picture ?? null,
    sourceUrl: pageUrl.href,
  };
};