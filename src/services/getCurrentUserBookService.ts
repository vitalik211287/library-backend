import { getCurrentUserBooks } from "../repositories/userReadingRepository.js";

import { getActiveUserReadingSessionService } from "./getActiveUserReadingSessionService.js";

export const getCurrentUserBookService = async (userId: string) => {
  const userBooks = await getCurrentUserBooks(userId);

  const books = await Promise.all(
    userBooks.map(async (userBook) => {
      const { book, ...userBookData } = userBook;

      const activeReading = await getActiveUserReadingSessionService(
        userId,
        book.id,
      );

      return {
        book,

        userBook: userBookData,

        activeSession: activeReading.session,

        elapsedSeconds: activeReading.elapsedSeconds,
      };
    }),
  );

  return {
    count: books.length,
    books,
  };
};
