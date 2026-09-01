import { getFinishedUserBooks } from "../repositories/userReadingRepository.js";

import { getEffectiveUserBooksService } from "./effectiveUserBooksService.js";

export const getFinishedUserBooksService = async (
  userId: string,
  page: number,
  limit: number,
  libraryId?: string,
) => {
  const { userBooks, total } = await getFinishedUserBooks(userId, page, limit);

  const books = await getEffectiveUserBooksService(
    userId,
    userBooks,
    libraryId,
  );

  const totalPages = Math.ceil(total / limit);

  return {
    count: books.length,
    total,
    page,
    limit,
    totalPages,
    books,
  };
};
