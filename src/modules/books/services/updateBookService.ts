import type { Prisma } from "@prisma/client";

import { updateBook } from "../repositories/booksRepository.js";

export const updateBookService = async (
  id: string,
  data: Prisma.BookUpdateInput,
) => {
  return updateBook(id, data);
};


