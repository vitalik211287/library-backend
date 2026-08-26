import { getBookFromVivat } from "./vivatProvider.js";
import { getBookFromKnigoland } from "./knigolandProvider.js";
import { getBookFromBookYe } from "./bookYeProvider.js";

import type { BookProvider } from "../types/providerBook.js";

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
    name: "book-ye",
    getBook: getBookFromBookYe,
  },
];