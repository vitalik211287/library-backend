import { getBookFromVivat } from "../providers/vivatProvider.js";

export const getBookByIsbnService = async (isbn: string) => {
  const book = await getBookFromVivat(isbn);

  return book;
};