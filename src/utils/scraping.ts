import type * as cheerio from "cheerio";

export const getCharacteristicValue = (
  $: cheerio.CheerioAPI,
  label: string,
): string | null => {
  let value: string | null = null;

  $("body *").each((_, element) => {
    const text = $(element).text().trim();

    if (text !== label) {
      return;
    }

    const nextText = $(element)
      .next()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (nextText) {
      value = nextText;
      return false;
    }
  });

  return value;
};

export const parseNumber = (
  value: string | null | undefined,
): number | null => {
  if (!value) {
    return null;
  }

  const match = value.match(/\d+/);

  if (!match) {
    return null;
  }

  const number = Number(match[0]);

  return Number.isNaN(number) ? null : number;
};