import { bookProviders } from "../../../providers/bookProviders.js";

import type { ProviderBook } from "../../../types/providerBook.js";

import { enrichBookViaSerper } from "../../../providers/serperBookEnrichment.js";

type LookupResult = ProviderBook & {
  source: string;
};

const enrichBook = async (
  isbn: string,
  baseBook: ProviderBook,
  baseProviderName: string,
): Promise<ProviderBook> => {
  let enriched = { ...baseBook };

  for (const provider of bookProviders) {
    if (provider.name === baseProviderName) {
      continue;
    }

    const needsEnrichment =
      !enriched.author ||
      !enriched.publisher ||
      !enriched.year ||
      !enriched.pages ||
      !enriched.language ||
      !enriched.genre ||
      !enriched.coverUrl;

    if (!needsEnrichment) {
      break;
    }

    try {
      console.log(`🧩 Enriching from provider: ${provider.name}`);

      const candidate = await provider.getBook(isbn);

      enriched = {
        ...enriched,
        author: enriched.author ?? candidate.author,
        publisher: enriched.publisher ?? candidate.publisher,
        year: enriched.year ?? candidate.year,
        pages: enriched.pages ?? candidate.pages,
        language: enriched.language ?? candidate.language,
        genre: enriched.genre ?? candidate.genre,
        coverUrl: enriched.coverUrl ?? candidate.coverUrl,
        description: enriched.description ?? candidate.description,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      console.log(`⚪ Enrichment ${provider.name}: ${message}`);
    }
  }

  return enriched;
};

export const lookupBookByIsbnService = async (
  isbn: string,
): Promise<LookupResult> => {
  const errors: string[] = [];

  console.log("🔎 LOOKUP SERVICE:", isbn);

  for (const provider of bookProviders) {
    try {
      console.log(`➡️ Trying provider: ${provider.name}`);

      const book = await provider.getBook(isbn);

      console.log(`✅ Found on ${provider.name}`);

      let enrichedBook = book;

      if (provider.name === "yakaboo-search") {
        enrichedBook = await enrichBook(isbn, book, provider.name);

        enrichedBook = await enrichBookViaSerper(enrichedBook);
      }

      if (provider.name === "google-books") {
        enrichedBook = await enrichBookViaSerper(enrichedBook, {
          overrideEditionFields: true,
        });
      }

      return {
        ...enrichedBook,
        source: provider.name,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      console.log(`❌ ${provider.name}: ${message}`);

      errors.push(`${provider.name}: ${message}`);
    }
  }

  throw new Error(
    `Book with ISBN ${isbn} was not found. ${errors.join(" | ")}`,
  );
};
