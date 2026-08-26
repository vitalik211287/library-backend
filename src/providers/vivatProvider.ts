import * as cheerio from "cheerio";
import { randomUUID } from "node:crypto";

import { uploadBookCover } from "../utils/uploadBookCover.js";
import { parseNumber } from "../utils/scraping.js";

import type { ProviderBook } from "../types/providerBook.js";

type MultisearchItem = {
  id: string;
  name: string;
  url: string;
  picture?: string;
};

type MultisearchResponse = {
  total: number;
  results?: {
    item_groups?: Array<{
      items?: MultisearchItem[][];
    }>;
  };
};

type VivatProductJson = {
  name?: string;
  image?: string;
  description?: string;
  brand?: {
    name?: string;
  };
};

type BreadcrumbItem = {
  position: number;
  name?: string;
  item?: {
    name?: string;
  };
};

type BreadcrumbJson = {
  itemListElement?: BreadcrumbItem[];
};

type Characteristic = {
  code: string;
  label: string;
  value: Array<{
    text: string;
  }>;
};

type NextData = {
  props?: {
    pageProps?: {
      product?: {
        allCharacteristics?: Characteristic[];
      };
    };
  };
};

export const getBookFromVivat = async (
  isbn: string,
): Promise<ProviderBook> => {
  // 1. Пошук книги
  const searchUrl = new URL("https://api.multisearch.io/");

  searchUrl.searchParams.set("id", "12340");
  searchUrl.searchParams.set(
    "key",
    "c7bff43fa20adee09deca89143415069",
  );
  searchUrl.searchParams.set("lang", "uk");
  searchUrl.searchParams.set("m", Date.now().toString());
  searchUrl.searchParams.set("q", "hyy26i");
  searchUrl.searchParams.set("query", isbn);
  searchUrl.searchParams.set("s", "medium");
  searchUrl.searchParams.set("uid", randomUUID());

  const searchResponse = await fetch(searchUrl, {
    headers: {
      Origin: "https://vivat.com.ua",
      Referer: "https://vivat.com.ua/",
    },
  });

  if (!searchResponse.ok) {
    throw new Error(
      `Vivat search failed: ${searchResponse.status}`,
    );
  }

  const searchData =
    (await searchResponse.json()) as MultisearchResponse;

  if (searchData.total === 0) {
    throw new Error(
      `Book with ISBN ${isbn} not found on Vivat`,
    );
  }

  const searchProduct =
    searchData.results?.item_groups?.[0]?.items?.[0]?.[0];

  if (!searchProduct?.url) {
    throw new Error("Vivat product URL not found");
  }

  // 2. Сторінка книги
  const productResponse = await fetch(searchProduct.url);

  if (!productResponse.ok) {
    throw new Error(
      `Vivat page failed: ${productResponse.status}`,
    );
  }

  const html = await productResponse.text();

  const $ = cheerio.load(html);

  // 3. Жанр
  let genre: string | null = null;

  const breadcrumbsJson = $("#BreadCrumbs").text().trim();

  if (breadcrumbsJson) {
    try {
      const breadcrumbs =
        JSON.parse(breadcrumbsJson) as BreadcrumbJson;

      const items = breadcrumbs.itemListElement ?? [];

      const genreItem = items.at(-2);

      genre =
        genreItem?.item?.name ??
        genreItem?.name ??
        null;
    } catch {
      genre = null;
    }
  }

  // 4. JSON-LD книги
  const productJson = $("#Product").text().trim();

  if (!productJson) {
    throw new Error(
      "Vivat Product JSON-LD not found",
    );
  }

  const productData =
    JSON.parse(productJson) as VivatProductJson;

  // 5. Next.js характеристики
  const nextDataJson =
    $("#__NEXT_DATA__").text().trim();

  if (!nextDataJson) {
    throw new Error(
      "Vivat __NEXT_DATA__ not found",
    );
  }

  const nextData =
    JSON.parse(nextDataJson) as NextData;

  const characteristics =
    nextData.props?.pageProps?.product
      ?.allCharacteristics ?? [];

  const getCharacteristic = (
    code: string,
  ): string | null => {
    return (
      characteristics.find(
        (characteristic) =>
          characteristic.code === code,
      )?.value?.[0]?.text ?? null
    );
  };

  const author = getCharacteristic(
    "author_code_entityelement",
  );

  const yearText =
    getCharacteristic("pub_year");

  const pagesText =
    getCharacteristic("pages_num");

  const language =
    getCharacteristic("language");

  // 6. Картинка
  const originalCoverUrl = productData.image
    ? new URL(
        productData.image,
        "https://vivat.com.ua",
      ).href
    : null;

  let coverUrl: string | null = null;

  if (originalCoverUrl) {
    try {
      coverUrl = await uploadBookCover(
        originalCoverUrl,
        isbn,
      );
    } catch (error) {
      console.error(
        "Vivat cover upload failed:",
        error,
      );
    }
  }

  // 7. Єдиний формат ProviderBook
  return {
    isbn,
    title:
      productData.name ??
      searchProduct.name,
    author,
    publisher:
      productData.brand?.name ?? null,
    year: parseNumber(yearText),
    pages: parseNumber(pagesText),
    language,
    genre,
    description:
      productData.description ?? null,
    coverUrl,
    sourceUrl: searchProduct.url,
  };
};