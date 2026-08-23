// providers/vivatProvider.ts

import * as cheerio from "cheerio";

export const getBookFromVivat = async (isbn: string) => {
  const response = await fetch(
    `https://vivat.com.ua/?s=${isbn}`
  );

  const html = await response.text();

  const $ = cheerio.load(html);

  console.log($.html().slice(0, 500));

  return {
    isbn,
  };
};