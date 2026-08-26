import { bookProviders } from "../providers/bookProviders.js";

import type { ProviderBook } from "../types/providerBook.js";

type LookupResult = ProviderBook & {
  source: string;
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

      return {
        ...book,
        source: provider.name,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error";

      console.log(`❌ ${provider.name}: ${message}`);

      errors.push(`${provider.name}: ${message}`);
    }
  }

  throw new Error(
    `Book with ISBN ${isbn} was not found. ${errors.join(" | ")}`,
  );
};