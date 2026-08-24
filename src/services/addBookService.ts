import { addBook } from "../repositories/addBook.js";
import type { Prisma } from "@prisma/client";

export const addBookService = async (
  data: Prisma.BookCreateInput,
) => {
  const book = await addBook(data);

  return book;
};