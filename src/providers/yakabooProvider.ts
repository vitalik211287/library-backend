import * as cheerio from "cheerio";
import { chromium } from "playwright";

import { uploadBookCover } from "../utils/uploadBookCover.js";
import {
  getCharacteristicValue,
  parseNumber,
} from "../utils/scraping.js";

import type { ProviderBook } from "../types/providerBook.js";

const BASE_URL = "https://www.yakaboo.ua";

const normalizeIsbn = (value: string) =>
  value.replace(/[^0-9X]/gi, "");

export const getBookFromYakaboo = async (
  isbn: string,
): Promise<ProviderBook> => {
  console.log("🔥 YAKABOO PROVIDER START:", isbn);

  const normalizedIsbn = normalizeIsbn(isbn);

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage({
      locale: "uk-UA",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
    });

    console.log("🌐 Opening Yakaboo");

    const response = await page.goto(
      `${BASE_URL}/ua/knigi.html`,
      {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      },
    );

    if (!response || !response.ok()) {
      throw new Error(
        `Yakaboo page failed: ${response?.status() ?? "no response"}`,
      );
    }

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Пошук"], input[placeholder*="пошук"]',
    ).first();

    await searchInput.waitFor({
      state: "visible",
      timeout: 15000,
    });

    console.log("🔎 Searching Yakaboo:", normalizedIsbn);

    await searchInput.fill(normalizedIsbn);
    await searchInput.press("Enter");

    await page.waitForTimeout(2500);

    console.log(
      "🌐 Yakaboo after search:",
      page.url(),
    );

    const links = await page.locator("a[href]").evaluateAll(
      (elements) =>
        elements
          .map((element) => ({
            href: (element as HTMLAnchorElement).href,
            text:
              element.textContent
                ?.replace(/\s+/g, " ")
                .trim() ?? "",
          }))
          .filter(
            (item) =>
              item.href.includes("yakaboo.ua") &&
              item.href.endsWith(".html"),
          ),
    );

    if (!links.length) {
      throw new Error(
        `Book with ISBN ${isbn} not found on Yakaboo`,
      );
    }

    let foundBook: ProviderBook | null = null;

    for (const candidate of links.slice(0, 15)) {
      console.log(
        "🔎 Yakaboo candidate:",
        candidate.href,
      );

      const productPage = await browser.newPage({
        locale: "uk-UA",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
      });

      try {
        const productResponse =
          await productPage.goto(candidate.href, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });

        if (
          !productResponse ||
          !productResponse.ok()
        ) {
          continue;
        }

        await productPage.waitForTimeout(1000);

        const html = await productPage.content();
        const $ = cheerio.load(html);

        const pageIsbn =
          getCharacteristicValue($, "ISBN");

        if (!pageIsbn) {
          continue;
        }

        console.log(
          "📖 Candidate ISBN:",
          pageIsbn,
        );

        if (
          normalizeIsbn(pageIsbn) !==
          normalizedIsbn
        ) {
          continue;
        }

        const title = $("h1")
          .first()
          .text()
          .replace(/\s+/g, " ")
          .trim();

        if (!title) {
          continue;
        }

        const author =
          getCharacteristicValue($, "Автор");

        const publisher =
          getCharacteristicValue(
            $,
            "Видавництво",
          );

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
            "Сторінок",
          );

        const language =
          getCharacteristicValue($, "Мова") ??
          getCharacteristicValue(
            $,
            "Мова книги",
          );

        const genre =
          getCharacteristicValue(
            $,
            "Категорія",
          );

        let description: string | null = null;

        const metaDescription =
          $('meta[name="description"]')
            .attr("content")
            ?.trim();

        if (metaDescription) {
          description = metaDescription;
        }

        const originalCoverUrl =
          $('meta[property="og:image"]')
            .attr("content") ??
          null;

        let coverUrl: string | null =
          originalCoverUrl;

        if (originalCoverUrl) {
          try {
            coverUrl =
              await uploadBookCover(
                originalCoverUrl,
                normalizedIsbn,
              );
          } catch (error) {
            console.error(
              "⚠️ Yakaboo cover upload failed:",
              error,
            );

            coverUrl = originalCoverUrl;
          }
        }

        foundBook = {
          isbn: pageIsbn,
          title,
          author,
          publisher,
          year: parseNumber(yearText),
          pages: parseNumber(pagesText),
          language,
          genre,
          description,
          coverUrl,
          sourceUrl: candidate.href,
        };

        console.log(
          "✅ YAKABOO BOOK FOUND:",
          title,
        );

        break;
      } finally {
        await productPage.close();
      }
    }

    if (!foundBook) {
      throw new Error(
        `Book with ISBN ${isbn} not found on Yakaboo`,
      );
    }

    return foundBook;
  } finally {
    await browser.close();
  }
};

