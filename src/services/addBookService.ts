import { addBook } from "../repositories/addBook.js";
import prisma from "../utils/prisma.js";
import type { Prisma } from "@prisma/client";

export const addBookService = async (data: Prisma.BookCreateInput) => {
  const existingBook = await prisma.book.findUnique({
    where: {
      isbn: data.isbn,
    },
  });

  if (existingBook) {
    const error = new Error("Book already exists") as Error & {
      statusCode?: number;
    };

    error.statusCode = 409;

    throw error;
  }

  return addBook(data);
};
