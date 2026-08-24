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

export const getBookFromKnigoland = async (isbn: string) => {
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

  const response = await fetch(`${SEARCH_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Knigoland search failed: ${response.status}`);
  }

  const data = (await response.json()) as SearchResponse;

  const firstGroup = data.results?.items?.[0];
  const firstBook = firstGroup?.items?.[0];

  if (!firstBook) {
    throw new Error(`Book with ISBN ${isbn} not found on Knigoland`);
  }

  return {
    isbn,
    title: firstBook.name,
    publisher: firstBook.brand ?? null,
    coverUrl: firstBook.picture ?? null,
    sourceUrl: firstBook.url ?? null,
  };
};