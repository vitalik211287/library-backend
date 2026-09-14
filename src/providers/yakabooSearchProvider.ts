import type { ProviderBook } from "../types/providerBook.js";

type SerperOrganicResult = {
  title?: string;
  link?: string;
  snippet?: string;
};

type SerperResponse = {
  organic?: SerperOrganicResult[];
};

const normalizeIsbn = (value: string) => value.replace(/[^0-9X]/gi, "");

const formatIsbn13 = (isbn: string) => {
  const normalized = normalizeIsbn(isbn);

  if (normalized.length !== 13) {
    return normalized;
  }

  if (normalized.startsWith("978966")) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6, 9)}-${normalized.slice(9, 12)}-${normalized.slice(12)}`;
  }

  if (normalized.startsWith("978617")) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6, 9)}-${normalized.slice(9, 12)}-${normalized.slice(12)}`;
  }

  return normalized;
};

const cleanYakabooUrl = (value: string) => {
  const url = new URL(value);

  url.search = "";
  url.hash = "";

  return url.href;
};

const parseTitleAndAuthor = (searchTitle: string | undefined) => {
  if (!searchTitle) {
    return {
      title: null,
      author: null,
    };
  }

  const normalized = searchTitle.replace(/\s+/g, " ").trim();

  const truncatedYakabooTitle = normalized.match(/^Книга\s+[«"](.+)$/i);

  if (truncatedYakabooTitle) {
    return {
      title: truncatedYakabooTitle[1]?.trim() ?? null,
      author: null,
    };
  }

  const match = normalized.match(
    /Книга\s+[«"](.+?)[»"]\s*[–—-]\s*(.+?)(?:,\s*\.\.\.|\.{3}|$)/i,
  );

  if (match) {
    return {
      title: match[1]?.trim() ?? null,
      author: match[2]?.trim() ?? null,
    };
  }

  const quotedTitle = normalized.match(/[«"](.+?)[»"]/);

  return {
    title:
      quotedTitle?.[1]?.trim() ??
      normalized.replace(/\s*[|–—-]\s*Yakaboo.*$/i, "").trim() ??
      null,
    author: null,
  };
};

const extractAuthorFromSnippet = (snippet: string | undefined) => {
  if (!snippet) {
    return null;
  }

  const match = snippet.match(/автор\s*[–—-]\s*([^,.;]+)/i);

  return match?.[1]?.trim() ?? null;
};

const isTechnicalSnippet = (
  snippet: string | undefined,
) => {
  if (!snippet) {
    return false;
  }

  const technicalMarkers = [
    "ISBN",
    "\u0424\u043e\u0440\u043c\u0430\u0442",
    "\u0412\u0430\u0433\u0430",
    "\u041f\u0430\u043f\u0456\u0440",
    "\u041a\u043e\u0434",
    "\u0420\u043e\u0437\u043c\u0456\u0440",
  ];

  const matches = technicalMarkers.filter(
    (marker) =>
      snippet
        .toLowerCase()
        .includes(marker.toLowerCase()),
  ).length;

  return matches >= 2;
};

const extractIsbnFromSnippet = (snippet: string | undefined) => {
  if (!snippet) {
    return null;
  }

  const match = snippet.match(/97[89][\d\s-]{10,20}\d/);

  return match ? normalizeIsbn(match[0]) : null;
};

export const getBookFromYakabooSearch = async (
  isbn: string,
): Promise<ProviderBook> => {
  console.log("🔎 YAKABOO SEARCH PROVIDER START:", isbn);

  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not configured");
  }

  const normalizedIsbn = normalizeIsbn(isbn);
  const formattedIsbn = formatIsbn13(isbn);

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: `"${formattedIsbn}" Yakaboo`,
      gl: "ua",
      hl: "uk",
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper search failed: ${response.status}`);
  }

  const data = (await response.json()) as SerperResponse;

  const yakabooResult = data.organic?.find((result) => {
    if (!result.link) {
      return false;
    }

    try {
      const url = new URL(result.link);

      return url.hostname === "yakaboo.ua" || url.hostname === "www.yakaboo.ua";
    } catch {
      return false;
    }
  });

  if (!yakabooResult?.link) {
    throw new Error(`Book with ISBN ${isbn} not found on Yakaboo via Serper`);
  }

  const snippetIsbn = extractIsbnFromSnippet(yakabooResult.snippet);

  if (snippetIsbn && snippetIsbn !== normalizedIsbn) {
    throw new Error(
      `Yakaboo ISBN mismatch: expected ${normalizedIsbn}, got ${snippetIsbn}`,
    );
  }

  const parsed = parseTitleAndAuthor(yakabooResult.title);

  const author =
    parsed.author ?? extractAuthorFromSnippet(yakabooResult.snippet);

  if (!parsed.title) {
    throw new Error(`Yakaboo title missing for ISBN ${isbn}`);
  }

  const sourceUrl = cleanYakabooUrl(yakabooResult.link);

  console.log("✅ YAKABOO SEARCH BOOK FOUND:", parsed.title);

  return {
    isbn: snippetIsbn ?? normalizedIsbn,
    title: parsed.title,
    author,
    publisher: null,
    year: null,
    pages: null,
    language: null,
    genre: null,
    description: isTechnicalSnippet(
      yakabooResult.snippet,
    )
      ? null
      : yakabooResult.snippet ?? null,
    coverUrl: null,
    sourceUrl,
  };
};
