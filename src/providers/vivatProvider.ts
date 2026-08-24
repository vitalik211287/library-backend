import * as cheerio from "cheerio";
import { randomUUID } from "node:crypto";
import cloudinary from "../config/cloudinary.js";

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

const uploadCoverToCloudinary = async (
  imageUrl: string,
  isbn: string,
): Promise<string> => {
  const imageResponse = await fetch(imageUrl);

  if (!imageResponse.ok) {
    throw new Error(
      `Vivat cover download failed with status ${imageResponse.status}`,
    );
  }

  const arrayBuffer = await imageResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "library/covers",
          public_id: `vivat-${isbn}`,
          overwrite: true,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result) {
            reject(new Error("Cloudinary upload failed"));
            return;
          }

          resolve({
            secure_url: result.secure_url,
          });
        },
      );

      uploadStream.end(buffer);
    },
  );

  return result.secure_url;
};

export const getBookFromVivat = async (isbn: string) => {
  // 1. Шукаємо книгу за ISBN
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
      `Multisearch failed with status ${searchResponse.status}`,
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

  // 2. Завантажуємо сторінку конкретної книги
  const productResponse = await fetch(searchProduct.url);

  if (!productResponse.ok) {
    throw new Error(
      `Vivat page failed with status ${productResponse.status}`,
    );
  }

  const html = await productResponse.text();

  const $ = cheerio.load(html);

  // 3. Жанр
  const breadcrumbsJson = $("#BreadCrumbs").text().trim();

  let genre: string | null = null;

  if (breadcrumbsJson) {
    const breadcrumbs =
      JSON.parse(breadcrumbsJson) as BreadcrumbJson;

    const items = breadcrumbs.itemListElement ?? [];

    const genreItem = items.at(-2);

    genre =
      genreItem?.item?.name ??
      genreItem?.name ??
      null;
  }

  // 4. Product JSON-LD
  const productJson = $("#Product").text().trim();

  if (!productJson) {
    throw new Error("Vivat Product JSON-LD not found");
  }

  const productData =
    JSON.parse(productJson) as VivatProductJson;

  // 5. Next.js JSON
  const nextDataJson = $("#__NEXT_DATA__").text().trim();

  if (!nextDataJson) {
    throw new Error("Vivat __NEXT_DATA__ not found");
  }

  const nextData = JSON.parse(nextDataJson) as NextData;

  const characteristics =
    nextData.props?.pageProps?.product?.allCharacteristics ??
    [];

  const getCharacteristic = (code: string) => {
    return characteristics.find(
      (characteristic) =>
        characteristic.code === code,
    )?.value?.[0]?.text;
  };

  const author =
    getCharacteristic("author_code_entityelement");

  const year = getCharacteristic("pub_year");

  const pages = getCharacteristic("pages_num");

  const language = getCharacteristic("language");

  // 6. Беремо картинку Vivat
  const vivatCoverUrl = productData.image
    ? new URL(
        productData.image,
        "https://vivat.com.ua",
      ).href
    : null;

  // 7. Переносимо обкладинку в Cloudinary
  let coverUrl: string | null = null;

  if (vivatCoverUrl) {
    try {
      coverUrl = await uploadCoverToCloudinary(
        vivatCoverUrl,
        isbn,
      );
    } catch (error) {
      console.error(
        "Не вдалося завантажити Vivat cover у Cloudinary:",
        error,
      );

      // Якщо Cloudinary тимчасово не спрацював,
      // хоча б повертаємо оригінальну картинку Vivat
      coverUrl = vivatCoverUrl;
    }
  }

  // 8. Повертаємо Book
  return {
    isbn,
    title:
      productData.name ??
      searchProduct.name,
    author: author ?? null,
    publisher:
      productData.brand?.name ?? null,
    year: year ? Number(year) : null,
    pages: pages ? Number(pages) : null,
    language: language ?? null,
    genre,
    description:
      productData.description ?? null,
    coverUrl,
    sourceUrl: searchProduct.url,
  };
};