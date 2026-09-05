import { updateBookCover } from "../repositories/booksRepository.js";

export const uploadBookCoverService = async (id: string, coverUrl: string) => {
  const book = await updateBookCover(id, coverUrl);

  return book;
};
