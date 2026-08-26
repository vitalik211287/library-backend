import {
  getActiveUserReadingSession,
  getBookById,
} from "../repositories/userReadingRepository.js";

export const getActiveUserReadingSessionService =
  async (
    userId: string,
    bookId: string,
  ) => {
    const book = await getBookById(bookId);

    if (!book) {
      throw new Error("Book not found");
    }

    const session =
      await getActiveUserReadingSession(
        userId,
        bookId,
      );

    if (!session) {
      return {
        session: null,
        elapsedSeconds: 0,
      };
    }

    const elapsedSeconds = Math.max(
      Math.floor(
        (Date.now() -
          session.startedAt.getTime()) /
          1000,
      ),
      0,
    );

    return {
      session,
      elapsedSeconds,
    };
  };