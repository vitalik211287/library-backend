import * as cheerio from "cheerio";
import { chromium } from "playwright";
import { randomUUID } from "node:crypto";

import { uploadBookCover } from "../utils/uploadBookCover.js";
import {
  getCharacteristicValue,
  parseNumber,
} from "../utils/scraping.js";

import type { ProviderBook } from "../types/providerBook.js";

const SEARCH_URL = "https://api.multisearch.io/";

type SearchItem = {
  id: string;
  name: string;
  url: string;
  picture?: string;
  brand?: string;
};

type SearchResponse = {
  query: string;
  total: number;
  results?: {
    item_groups?: Array<{
      category?: {
        name?: string;
      };
      items?: SearchItem[];
    }>;
  };
};

export const getBookFromBookYe = async (
  isbn: string,
): Promise<ProviderBook> => {
  console.log("🔥 BOOK-YE PROVIDER START:", isbn);

  // 1. Шукаємо книгу через Multisearch
  const searchUrl = new URL(SEARCH_URL);

  searchUrl.searchParams.set("id", "11908");
  searchUrl.searchParams.set(
    "key",
    "a9d3f40fecc052c6496c1c83077d7a4b",
  );
  searchUrl.searchParams.set("lang", "uk");
  searchUrl.searchParams.set("m", Date.now().toString());
  searchUrl.searchParams.set("q", "jkemel");
  searchUrl.searchParams.set("query", isbn);
  searchUrl.searchParams.set("s", "mini");
  searchUrl.searchParams.set("uid", randomUUID());

  const searchResponse = await fetch(searchUrl, {
    headers: {
      Origin: "https://book-ye.com.ua",
      Referer: "https://book-ye.com.ua/",
    },
  });

  if (!searchResponse.ok) {
    throw new Error(
      `Book Ye search failed: ${searchResponse.status}`,
    );
  }

  const searchData =
    (await searchResponse.json()) as SearchResponse;

  if (!searchData.total) {
    throw new Error(
      `Book with ISBN ${isbn} not found on Book Ye`,
    );
  }

  const firstGroup =
    searchData.results?.item_groups?.[0];

  const firstBook =
    firstGroup?.items?.[0];

  if (!firstBook?.url) {
    throw new Error(
      `Book Ye product URL missing for ISBN ${isbn}`,
    );
  }

  const pageUrl = new URL(firstBook.url);

  pageUrl.search = "";

  // 2. Відкриваємо сторінку через Chromium
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage({
      locale: "uk-UA",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
    });

    console.log(
      "🌐 Opening Book Ye page:",
      pageUrl.href,
    );

    const response = await page.goto(
      pageUrl.href,
      {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      },
    );

    if (!response) {
      throw new Error(
        "Book Ye page response is empty",
      );
    }

    console.log(
      "BOOK-YE BROWSER STATUS:",
      response.status(),
    );

    if (!response.ok()) {
      throw new Error(
        `Book Ye browser page failed: ${response.status()}`,
      );
    }

    // даємо сторінці трохи часу дорендеритись
    await page.waitForTimeout(1500);

    const html = await page.content();

    const $ = cheerio.load(html);

    // 3. Характеристики
    const pageIsbn =
      getCharacteristicValue($, "ISBN");

    const author =
      getCharacteristicValue($, "Автор");

    const publisher =
      getCharacteristicValue(
        $,
        "Видавництво",
      ) ??
      firstBook.brand ??
      null;

    const yearText =
      getCharacteristicValue(
        $,
        "Рік видання",
      );

    const pagesText =
      getCharacteristicValue(
        $,
        "Кількість сторінок",
      ) ??
      getCharacteristicValue(
        $,
        "Сторінки",
      );

    const language =
      getCharacteristicValue(
        $,
        "Мова",
      );

    // 4. Жанр
    const genre =
      firstGroup?.category?.name ?? null;

    // 5. Опис
    let description: string | null = null;

    const shortDescription = $(
      ".prod_shortdesc",
    )
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (shortDescription) {
      description = shortDescription;
    } else {
      const metaDescription = $(
        'meta[name="description"]',
      )
        .attr("content")
        ?.trim();

      description =
        metaDescription || null;
    }

    // 6. Обкладинка
    let coverUrl: string | null =
      firstBook.picture ?? null;

    // Пробуємо взяти кращу картинку зі сторінки
    const ogImage = $(
      'meta[property="og:image"]',
    ).attr("content");

    const originalCoverUrl =
      ogImage ??
      firstBook.picture ??
      null;

    if (originalCoverUrl) {
      try {
        coverUrl =
          await uploadBookCover(
            originalCoverUrl,
            isbn,
          );

        console.log(
          "✅ BOOK-YE COVER UPLOADED:",
          coverUrl,
        );
      } catch (error) {
        console.error(
          "⚠️ Book Ye cover upload failed:",
          error,
        );

        coverUrl = originalCoverUrl;
      }
    }

    // 7. Повертаємо повну книгу
    return {
      isbn: pageIsbn ?? isbn,
      title: firstBook.name,
      author,
      publisher,
      year: parseNumber(yearText),
      pages: parseNumber(pagesText),
      language,
      genre,
      description,
      coverUrl,
      sourceUrl: pageUrl.href,
    };
  } finally {
    await browser.close();
  }
};