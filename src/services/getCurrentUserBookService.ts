import { getCurrentUserBooks } from "../repositories/userReadingRepository.js";

import {
  getActiveReadingDataForBooks,
  getEffectiveUserBooksService,
  getElapsedSeconds,
} from "./effectiveUserBooksService.js";

export const getCurrentUserBookService = async (
  userId: string,
  libraryId?: string,
) => {
  const userBooks = await getCurrentUserBooks(userId);

  const bookIds = userBooks.map((userBook) => userBook.bookId);

  const [books, activeSessionMap] = await Promise.all([
    getEffectiveUserBooksService(userId, userBooks, libraryId),

    getActiveReadingDataForBooks(userId, bookIds),
  ]);

  return {
    count: books.length,

    books: books.map((book) => {
      const activeSession = activeSessionMap.get(book.id) ?? null;

      return {
        ...book,

        activeSession,

        elapsedSeconds: getElapsedSeconds(activeSession),
      };
    }),
  };
};
