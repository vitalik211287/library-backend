import { getCurrentUserBook } from "../repositories/userReadingRepository.js";

import { getActiveUserReadingSessionService } from "./getActiveUserReadingSessionService.js";

export const getCurrentUserBookService =
  async (userId: string) => {
    const userBook =
      await getCurrentUserBook(userId);

    if (!userBook) {
      return null;
    }

    const {
      book,
      ...userBookData
    } = userBook;

    const activeReading =
      await getActiveUserReadingSessionService(
        userId,
        book.id,
      );

    return {
      book,

      userBook: userBookData,

      activeSession:
        activeReading.session,

      elapsedSeconds:
        activeReading.elapsedSeconds,
    };
  };