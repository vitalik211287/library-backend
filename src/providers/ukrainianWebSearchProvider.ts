import type { ProviderBook } from "../types/providerBook.js";
import { enrichBookViaSerper } from "./serperBookEnrichment.js";
import { extractBookFromWebPage } from "../utils/webBookPageExtractor.js";

type SerperOrganicResult = {
  title?: string;
  link?: string;
  snippet?: string;
};

type SerperResponse = {
  organic?: SerperOrganicResult[];
};

const normalizeIsbn = (value: string) => value.replace(/[^0-9X]/gi, "");

const containsExactIsbn = (result: SerperOrganicResult, isbn: string) => {
  const text = [result.title, result.snippet].filter(Boolean).join(" ");

  return normalizeIsbn(text).includes(normalizeIsbn(isbn));
};

const cleanTitle = (value: string) =>
  value.replace(/\s*[|-]\s*[^|]+$/i, "").trim();

const scoreCandidate = (result: SerperOrganicResult, isbn: string) => {
  const title = result.title?.trim() ?? "";
  const snippet = result.snippet?.trim() ?? "";

  let score = 0;

  if (containsExactIsbn(result, isbn)) {
    score += 50;
  }

  if (title.length >= 5) {
    score += 10;
  }

  if (snippet.length >= 20) {
    score += 10;
  }

  if (/author|isbn|publisher|pages|language/i.test(snippet)) {
    score += 10;
  }

  if (/book|product|catalog/i.test(result.link ?? "")) {
    score += 5;
  }

  if (title.length > 120) {
    score -= 10;
  }

  return score;
};

const countBibliographicFields = (book: ProviderBook) => {
  const fields = [
    book.author,
    book.publisher,
    book.year,
    book.pages,
    book.language,
    book.genre,
  ];

  return fields.filter(Boolean).length;
};

export const getBookFromUkrainianWebSearch = async (
  isbn: string,
): Promise<ProviderBook> => {
  console.log("UKRAINIAN WEB SEARCH START:", isbn);

  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not configured");
  }

  const normalizedIsbn = normalizeIsbn(isbn);

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: `"${normalizedIsbn}"`,
      gl: "ua",
      hl: "uk",
      num: 10,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ukrainian web search failed: ${response.status}`);
  }

  const searchQueries = [
    `"${normalizedIsbn}"`,
    `"${normalizedIsbn}" книга`,
    `"ISBN ${normalizedIsbn}"`,
  ];

  const organicResults: SerperOrganicResult[] = [];

  for (const query of searchQueries) {
    console.log("UKRAINIAN WEB SEARCH QUERY:", query);

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        gl: "ua",
        hl: "uk",
        num: 10,
      }),
    });

    if (!response.ok) {
      console.log(
        `UKRAINIAN WEB SEARCH QUERY FAILED: ${query} (${response.status})`,
      );
      continue;
    }

    const data = (await response.json()) as SerperResponse;

    organicResults.push(...(data.organic ?? []));

    const hasExactIsbnCandidate = (data.organic ?? []).some(
      (result) =>
        result.link &&
        result.title &&
        containsExactIsbn(result, normalizedIsbn),
    );

    if (hasExactIsbnCandidate) {
      console.log("UKRAINIAN WEB SEARCH QUERY MATCH:", query);
      break;
    }
  }

  const candidates = organicResults
    .filter(
      (result) =>
        result.link &&
        result.title &&
        containsExactIsbn(result, normalizedIsbn),
    )
    .map((result) => ({
      result,
      score: scoreCandidate(result, normalizedIsbn),
    }))
    .sort((a, b) => b.score - a.score);

  const bestCandidate = candidates[0];

  if (
    !bestCandidate ||
    !bestCandidate.result.title ||
    !bestCandidate.result.link
  ) {
    throw new Error(
      `Book with ISBN ${normalizedIsbn} not found in Ukrainian web search`,
    );
  }

  console.log(
    "UKRAINIAN WEB SEARCH CANDIDATE:",
    bestCandidate.score,
    bestCandidate.result.title,
    bestCandidate.result.link,
  );

  const pageData = await extractBookFromWebPage(
    bestCandidate.result.link,
    normalizedIsbn,
  );

  console.log("UKRAINIAN WEB PAGE EXTRACTION:", pageData ? "FOUND" : "NO DATA");

  const book: ProviderBook = {
    isbn: normalizedIsbn,
    title: pageData?.title ?? cleanTitle(bestCandidate.result.title),
    author: pageData?.author ?? null,
    publisher: pageData?.publisher ?? null,
    year: pageData?.year ?? null,
    pages: pageData?.pages ?? null,
    language: pageData?.language ?? null,
    genre: pageData?.genre ?? null,
    description: pageData?.description ?? bestCandidate.result.snippet ?? null,
    coverUrl: pageData?.coverUrl ?? null,
    sourceUrl: bestCandidate.result.link,
  };

  const enrichedBook = await enrichBookViaSerper(book, {
    overrideEditionFields: true,
  });

  const bibliographicFields = countBibliographicFields(enrichedBook);

  if (bibliographicFields < 2) {
    throw new Error(
      `Low-confidence result for ISBN ${normalizedIsbn}: only ${bibliographicFields} bibliographic fields`,
    );
  }

  console.log(
    "UKRAINIAN WEB SEARCH FOUND:",
    enrichedBook.title,
    `score=${bestCandidate.score}`,
    `fields=${bibliographicFields}`,
  );

  return enrichedBook;
};
