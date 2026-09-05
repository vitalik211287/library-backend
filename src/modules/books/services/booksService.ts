import {
  getAllBooks,
  getBookByIsbn,
} from "../repositories/booksRepository.js";

import { getBookFromVivat } from "../../../providers/vivatProvider.js";

export const getAllBooksService = async () => {
  const books = await getAllBooks();

  return books;
};

export const getBookByIsbnService = async (isbn: string) => {
  const localBook = await getBookByIsbn(isbn);

  if (localBook) {
    return {
      ...localBook,
      source: "local",
    };
  }

  const bookFromVivat = await getBookFromVivat(isbn);

  return {
    ...bookFromVivat,
    source: "vivat",
  };
};

