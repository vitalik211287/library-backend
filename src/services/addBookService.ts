import { addBook } from "../repositories/addBook.js";
import type { Prisma } from "../generated/prisma/client.js";

export const addBookService = async (data: Prisma.BookCreateInput) => {
  const book = await addBook(data);

  return book;
};