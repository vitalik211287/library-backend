import * as cheerio from "cheerio";

type JsonLdValue = {
  "@type"?: string | string[];
  name?: string;
  author?: unknown;
  publisher?: unknown;
  datePublished?: string | number;
  numberOfPages?: string | number;
  inLanguage?: string;
  genre?: string | string[];
  description?: string;
  image?: unknown;
  isbn?: string;
  [key: string]: unknown;
};

export type ExtractedBookPage = {
  title: string | null;
  author: string | null;
  publisher: string | null;
  year: number | null;
  pages: number | null;
  language: string | null;
  genre: string | null;
  description: string | null;
  coverUrl: string | null;
};

const normalizeIsbn = (value: string) => value.replace(/[^0-9X]/gi, "");

const cleanText = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  return value.replace(/\s+/g, " ").trim() || null;
};

const textValue = (value: unknown): string | null => {
  if (typeof value === "string") {
    return cleanText(value);
  }

  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;

    return typeof name === "string" ? cleanText(name) : null;
  }

  return null;
};

const authorValue = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    const authors = value
      .map(textValue)
      .filter((author): author is string => Boolean(author));

    return authors.length ? authors.join(", ") : null;
  }

  return textValue(value);
};

const imageValue = (value: unknown): string | null => {
  if (typeof value === "string") {
    return cleanText(value);
  }

  if (Array.isArray(value)) {
    return imageValue(value[0]);
  }

  if (value && typeof value === "object") {
    const image = value as {
      url?: unknown;
      contentUrl?: unknown;
    };

    return textValue(image.url) ?? textValue(image.contentUrl);
  }

  return null;
};

const isBookLike = (value: JsonLdValue) => {
  const types = Array.isArray(value["@type"])
    ? value["@type"]
    : [value["@type"]];

  return types.some((type) => type === "Book" || type === "Product");
};

const collectJsonLd = (value: unknown): JsonLdValue[] => {
  if (Array.isArray(value)) {
    return value.flatMap(collectJsonLd);
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const object = value as JsonLdValue;
  const graph = object["@graph"];

  return [object, ...(graph ? collectJsonLd(graph) : [])];
};

const makeAbsoluteUrl = (
  value: string | null,
  pageUrl: string,
): string | null => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, pageUrl).toString();
  } catch {
    return value;
  }
};

const extractFromJsonLd = (
  $: cheerio.CheerioAPI,
  requestedIsbn: string,
): ExtractedBookPage | null => {
  const objects: JsonLdValue[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).text().trim();

    if (!raw) {
      return;
    }

    try {
      objects.push(...collectJsonLd(JSON.parse(raw)));
    } catch {
      // Ignore malformed JSON-LD.
    }
  });

  const normalizedRequestedIsbn = normalizeIsbn(requestedIsbn);

  const candidate = objects.find((item) => {
    if (!isBookLike(item) || !item.isbn) {
      return false;
    }

    return normalizeIsbn(item.isbn) === normalizedRequestedIsbn;
  });

  if (!candidate) {
    return null;
  }

  const yearMatch = String(candidate.datePublished ?? "").match(/(19|20)\d{2}/);

  const pagesMatch = String(candidate.numberOfPages ?? "").match(/\d+/);

  return {
    title: textValue(candidate.name),
    author: authorValue(candidate.author),
    publisher: textValue(candidate.publisher),
    year: yearMatch ? Number(yearMatch[0]) : null,
    pages: pagesMatch ? Number(pagesMatch[0]) : null,
    language: textValue(candidate.inLanguage),
    genre: Array.isArray(candidate.genre)
      ? candidate.genre.join(", ")
      : textValue(candidate.genre),
    description: textValue(candidate.description),
    coverUrl: imageValue(candidate.image),
  };
};

const extractFromKohaHtml = (
  $: cheerio.CheerioAPI,
  requestedIsbn: string,
  pageUrl: string,
): ExtractedBookPage | null => {
  const record = $("#catalogue_detail_biblio .record").first();

  if (!record.length) {
    return null;
  }

  const isbn = cleanText(record.find('[property="isbn"]').first().text());

  if (!isbn || normalizeIsbn(isbn) !== normalizeIsbn(requestedIsbn)) {
    return null;
  }

  const titleElement = record.find('h1.title[property="name"]').first().clone();

  titleElement.find(".title_resp_stmt").remove();

  const title = cleanText(titleElement.text());

  const author = cleanText(
    record.find('[property="author"] [property="name"]').first().text(),
  );

  const publisher = cleanText(
    record.find('[property="publisher"] [property="name"]').first().text(),
  );

  const yearText = cleanText(
    record.find('[property="datePublished"]').first().text(),
  );

  const yearMatch = yearText?.match(/(19|20)\d{2}/);

  const language = cleanText(
    record.find(".results_summary.languages .language").first().text(),
  )?.replace(/^Мова:\s*/i, "");

  const descriptionText = cleanText(
    record
      .find(".results_summary.description [property='description']")
      .first()
      .text(),
  );

  console.log("KOHA DESCRIPTION TEXT:", JSON.stringify(descriptionText));

  console.log(
    "KOHA DESCRIPTION BLOCKS:",
    record
      .find(".results_summary")
      .map((_, element) => $(element).text().replace(/\s+/g, " ").trim())
      .get(),
  );

  const pagesMatch = descriptionText?.match(/(\d+)\s*с\.?/i);

  const genre = cleanText(record.find('[property="keywords"]').first().text());

  const description = descriptionText && !pagesMatch ? descriptionText : null;

  const coverSrc =
    $("#biblio-cover-slider .local-coverimg img").first().attr("src") ??
    $("#images_panel img").first().attr("src") ??
    null;

  if (!title) {
    return null;
  }

  return {
    title,
    author,
    publisher,
    year: yearMatch ? Number(yearMatch[0]) : null,
    pages: pagesMatch ? Number(pagesMatch[1]) : null,
    language: cleanText(language),
    genre,
    description,
    coverUrl: makeAbsoluteUrl(coverSrc, pageUrl),
  };
};

const extractFromHtml = (
  $: cheerio.CheerioAPI,
  requestedIsbn: string,
  pageUrl: string,
): ExtractedBookPage | null => {
  const normalizedRequestedIsbn = normalizeIsbn(requestedIsbn);

  let result: ExtractedBookPage | null = null;

  $("tr, article, .product, .book, div[data-key]").each((_, element) => {
    if (result) {
      return false;
    }

    const container = $(element);
    const text = container.text().replace(/\s+/g, " ").trim();

    const isbnMatch = text.match(/ISBN\s*:\s*([0-9Xx\-\s]+)/i);

    if (!isbnMatch?.[1]) {
      return;
    }

    if (normalizeIsbn(isbnMatch[1]) !== normalizedRequestedIsbn) {
      return;
    }

    const authorMatch = text.match(/Автор(?:\(и\))?\s*:\s*(.+?)\s*ISBN\s*:/i);

    const publisherElement = container
      .find(".book-authors")
      .filter((_, element) =>
        $(element).text().trim().toLowerCase().startsWith("видавництво:"),
      )
      .first();

    const publisherFromElement = cleanText(
      publisherElement.find("b").first().text(),
    );

    const publisherMatch = text.match(/Видавництво\s*:\s*(.+?)(?=\s{2,}|$)/i);

    const titleMatch = text.match(
      /(?:Підручник|Посібник|Книга)?\s*["“]?(.+?)["”]?\s*Автор(?:\(и\))?\s*:/i,
    );

    const title = cleanText(titleMatch?.[1]);
    const author = cleanText(authorMatch?.[1]);
    const publisher = publisherFromElement ?? cleanText(publisherMatch?.[1]);

    if (!title) {
      return;
    }

    const imageSrc = container.find("img").first().attr("src") ?? null;

    const descriptionMatch = text.match(
      /Видавництво\s*:\s*.+?\s+(.+?)(?=\d+[.,]\d{2}|$)/i,
    );

    result = {
      title,
      author,
      publisher,
      year: null,
      pages: null,
      language: null,
      genre: null,
      description: cleanText(descriptionMatch?.[1]),
      coverUrl: makeAbsoluteUrl(imageSrc, pageUrl),
    };

    return false;
  });

  return result;
};

export const extractBookFromWebPage = async (
  url: string,
  requestedIsbn: string,
): Promise<ExtractedBookPage | null> => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; LibraryBookResolver/1.0)",
    },
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();

  if (!normalizeIsbn(html).includes(normalizeIsbn(requestedIsbn))) {
    return null;
  }

  const $ = cheerio.load(html);

  const jsonLdResult = extractFromJsonLd($, requestedIsbn);

  if (jsonLdResult) {
    console.log("WEB PAGE EXTRACTOR: JSON-LD");

    return {
      ...jsonLdResult,
      coverUrl: makeAbsoluteUrl(jsonLdResult.coverUrl, url),
    };
  }

  const kohaResult = extractFromKohaHtml($, requestedIsbn, url);

  if (kohaResult) {
    console.log("WEB PAGE EXTRACTOR: KOHA");
    return kohaResult;
  }

  const htmlResult = extractFromHtml($, requestedIsbn, url);

  if (htmlResult) {
    console.log("WEB PAGE EXTRACTOR: HTML FALLBACK");
    return htmlResult;
  }

  return null;
};
