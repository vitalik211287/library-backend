import type { Prisma } from "@prisma/client";

import { createBook, getBookByIsbn } from "../repositories/booksRepository.js";

export const addBookService = async (data: Prisma.BookCreateInput) => {
  const existingBook = await getBookByIsbn(data.isbn);

  if (existingBook) {
    const error = new Error("Book already exists") as Error & {
      statusCode?: number;
    };

    error.statusCode = 409;

    throw error;
  }

  return createBook(data);
};
