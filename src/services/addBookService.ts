import { addBook } from "../repositories/addBook.js";
import { saveBookCover } from "./coverService.js";

import type { Prisma } from "../generated/prisma/client.js";

export const addBookService = async (
  data: Prisma.BookCreateInput
) => {
  let localCoverUrl: string | null = data.coverUrl ?? null;

  if (data.coverUrl) {
    localCoverUrl = await saveBookCover(
      data.coverUrl,
      data.isbn
    );
  }

  const bookData: Prisma.BookCreateInput = {
    ...data,
    coverUrl: localCoverUrl,
  };

  const book = await addBook(bookData);

  return book;
};