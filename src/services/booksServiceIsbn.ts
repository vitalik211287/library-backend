import { getBookFromVivat } from "../providers/vivatProvider.js";
import { getBookFromKnigoland } from "../providers/knigolandProvider.js";

export const getBookByIsbnService = async (isbn: string) => {
  try {
    return await getBookFromVivat(isbn);
  } catch (error) {
    console.log("Vivat не знайшов книгу, пробуємо Knigoland");

    return await getBookFromKnigoland(isbn);
  }
};