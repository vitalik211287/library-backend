import { getBookFromVivat } from "./vivatProvider.js";
import { getBookFromKnigoland } from "./knigolandProvider.js";
import { getBookFromBookish } from "./bookishProvider.js";
import { getBookFromBookYe } from "./bookYeProvider.js";
import { getBookFromGoogleBooks } from "./googleBooksProvider.js";
import { getBookFromYakabooSearch } from "./yakabooSearchProvider.js";
import { getBookFromUkrainianWebSearch } from "./ukrainianWebSearchProvider.js";

import type { BookProvider } from "../types/providerBook.js";

import { getBookFromBookPlus } from "./bookPlusProvider.js";

export const bookProviders: BookProvider[] = [
  {
    name: "vivat",
    getBook: getBookFromVivat,
  },
  {
    name: "knigoland",
    getBook: getBookFromKnigoland,
  },
  {
    name: "bookish",
    getBook: getBookFromBookish,
  },
  {
    name: "book-ye",
    getBook: getBookFromBookYe,
  },
  {
    name: "book-plus",
    getBook: getBookFromBookPlus,
  },
  {
    name: "google-books",
    getBook: getBookFromGoogleBooks,
  },
  {
    name: "yakaboo-search",
    getBook: getBookFromYakabooSearch,
  },
  {
    name: "ukrainian-web-search",
    getBook: getBookFromUkrainianWebSearch,
  },
];
