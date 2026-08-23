import { getAllBooks } from "../repositories/booksRepository.js";
import { getBookFromVivat } from "../providers/vivatProvider.js";

export const getAllBooksService = async () => {
  const books = await getAllBooks();

  return books;
};

export const lookupBookByIsbnService = async (isbn: string) => {
  const book = await getBookFromVivat(isbn);

  return book;
};