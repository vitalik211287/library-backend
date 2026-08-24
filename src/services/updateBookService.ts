import { updateBook } from "../repositories/updateBook.js";
import type { Prisma } from "@prisma/client";

export const updateBookService = async (
  id: string,
  data: Prisma.BookUpdateInput,
) => {
  return updateBook(id, data);
};