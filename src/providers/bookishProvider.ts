import * as cheerio from "cheerio";

import { uploadBookCover } from "../utils/uploadBookCover.js";
import { parseNumber } from "../utils/scraping.js";

import type { ProviderBook } from "../types/providerBook.js";

const BASE_URL = "https://bookish.kiev.ua";

type BookishSearchItem = {
  quantity?: number;
  price_value?: boolean;
  product_id?: string;
  name?: string;
  thumb?: string;
  thumb2?: string;
  price?: string;
  special?: boolean;
  href?: string;
  view_more?: boolean;
};

type BookishSearchResponse = {
  response?: BookishSearchItem[];
  status?: string;
};

const normalizeIsbn = (value: string) => {
  return value.replace(/[^\dXx]/g, "");
};

const cleanText = (
  value: string | null | undefined,
) => {
  return value
    ? value.replace(/\s+/g, " ").trim()
    : "";
};

export const getBookFromBookish = async (
  isbn: string,
): Promise<ProviderBook> => {
  console.log(
    "🔥 BOOKISH PROVIDER START:",
    isbn,
  );

  const normalizedIsbn =
    normalizeIsbn(isbn);

  // =========================
  // 1. ПОШУК КНИГИ
  // =========================

  const searchUrl = new URL(
    "/index.php",
    BASE_URL,
  );

  searchUrl.searchParams.set(
    "route",
    "common/header/search",
  );

  searchUrl.searchParams.set(
    "search",
    normalizedIsbn,
  );

  console.log(
    "🔎 BOOKISH SEARCH:",
    searchUrl.href,
  );

  const searchResponse = await fetch(
    searchUrl,
    {
      headers: {
        Accept:
          "application/json, text/javascript, */*; q=0.01",

        "X-Requested-With":
          "XMLHttpRequest",

        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36",
      },
    },
  );

  if (!searchResponse.ok) {
    throw new Error(
      `Bookish search failed: ${searchResponse.status}`,
    );
  }

  const searchData =
    (await searchResponse.json()) as BookishSearchResponse;

  const products =
    searchData.response?.filter(
      (item) =>
        item.product_id &&
        item.href &&
        !item.view_more,
    ) ?? [];

  if (!products.length) {
    throw new Error(
      `Book with ISBN ${isbn} not found on Bookish`,
    );
  }

  const exactProduct =
    products.find((product) => {
      return (
        product.href?.includes(
          normalizedIsbn,
        ) ||
        product.thumb?.includes(
          normalizedIsbn,
        ) ||
        product.thumb2?.includes(
          normalizedIsbn,
        )
      );
    }) ?? products[0];

  if (!exactProduct?.href) {
    throw new Error(
      "Bookish product URL not found",
    );
  }

  // =========================
  // 2. СТОРІНКА КНИГИ
  // =========================

  console.log(
    "📘 BOOKISH PRODUCT:",
    exactProduct.href,
  );

  const pageResponse = await fetch(
    exactProduct.href,
    {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

        "Accept-Language":
          "uk-UA,uk;q=0.9,en;q=0.8",

        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36",
      },
    },
  );

  if (!pageResponse.ok) {
    throw new Error(
      `Bookish page failed: ${pageResponse.status}`,
    );
  }

  const html =
    await pageResponse.text();

  const $ =
    cheerio.load(html);

  // =========================
  // 3. ХАРАКТЕРИСТИКИ
  // =========================

  const characteristics:
    Record<string, string> = {};

  $(
    'tr[itemprop="additionalProperty"]',
  ).each((_, element) => {
    const name = cleanText(
      $(element)
        .find('[itemprop="name"]')
        .first()
        .text(),
    );

    const value = cleanText(
      $(element)
        .find('[itemprop="value"]')
        .first()
        .text(),
    );

    if (name && value) {
      characteristics[name] =
        value;
    }
  });

  console.log(
    "📋 BOOKISH CHARACTERISTICS:",
    characteristics,
  );

  // =========================
  // 4. ISBN
  // =========================

  let pageIsbn: string | null =
    null;

  $(".article_block").each(
    (_, element) => {
      const text = cleanText(
        $(element).text(),
      );

      const match = text.match(
        /ISBN\s*:\s*([0-9Xx\- ]+)/i,
      );

      if (match?.[1]) {
        pageIsbn =
          normalizeIsbn(
            match[1],
          );

        return false;
      }
    },
  );

  // =========================
  // 5. НАЗВА
  // =========================

  const title =
    cleanText(
      $("h1").first().text(),
    ) ||
    cleanText(
      $('meta[property="og:title"]').attr(
        "content",
      ),
    ) ||
    cleanText(
      exactProduct.name,
    );

  if (!title) {
    throw new Error(
      "Bookish title not found",
    );
  }

  // =========================
  // 6. АВТОР
  // =========================

  const author =
    characteristics["Автор"] ??
    characteristics["Автори"] ??
    null;

  // =========================
  // 7. ВИДАВНИЦТВО
  // =========================

  const publisher =
    characteristics[
      "Видавництво"
    ] ??
    characteristics[
      "Видавець"
    ] ??
    null;

  // =========================
  // 8. РІК
  // =========================

  const yearText =
    characteristics[
      "Рік видання"
    ] ??
    characteristics["Рік"] ??
    null;

  // =========================
  // 9. СТОРІНКИ
  // =========================

  const pagesText =
    characteristics[
      "Кількість сторінок"
    ] ??
    characteristics[
      "Сторінок"
    ] ??
    null;

  // =========================
  // 10. МОВА
  // =========================

  const language =
    characteristics[
      "Мова"
    ] ??
    characteristics[
      "Мова видання"
    ] ??
    null;

  // =========================
  // 11. ЖАНР
  // =========================

  const genre =
    characteristics[
      "Жанр"
    ] ??
    characteristics[
      "Категорія"
    ] ??
    null;

  // =========================
  // 12. ОПИС
  // =========================

  let description =
    cleanText(
      $(
        'meta[property="og:description"]',
      ).attr("content"),
    );

  if (!description) {
    description =
      cleanText(
        $("#tab-description")
          .first()
          .text(),
      );
  }

  if (!description) {
    description =
      cleanText(
        $(".product-description")
          .first()
          .text(),
      );
  }

  // =========================
  // 13. ОБКЛАДИНКА
  // =========================

  const originalCoverUrl =
    $('meta[property="og:image"]').attr(
      "content",
    ) ??
    exactProduct.thumb2 ??
    exactProduct.thumb ??
    null;

  let coverUrl: string | null =
    null;

  if (originalCoverUrl) {
    try {
      coverUrl =
        await uploadBookCover(
          originalCoverUrl,
          normalizedIsbn,
        );

      console.log(
        "☁️ BOOKISH COVER:",
        coverUrl,
      );
    } catch (error) {
      console.error(
        "Bookish cover upload failed:",
        error,
      );
    }
  }

  // =========================
  // 14. РЕЗУЛЬТАТ
  // =========================

  const result: ProviderBook = {
    isbn:
      normalizedIsbn,

    title,

    author,

    publisher,

    year:
      parseNumber(yearText),

    pages:
      parseNumber(pagesText),

    language,

    genre,

    description:
      description || null,

    coverUrl,

    sourceUrl:
      exactProduct.href,
  };

  console.log(
    "✅ BOOKISH RESULT:",
    result,
  );

  return result;
};