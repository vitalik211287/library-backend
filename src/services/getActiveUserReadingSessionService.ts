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

    const now = Date.now();

    const totalElapsedSeconds = Math.max(
      Math.floor(
        (now -
          session.startedAt.getTime()) /
          1000,
      ),
      0,
    );

    let totalPausedSeconds =
      session.pausedSeconds;

    if (session.pausedAt) {
      const currentPauseSeconds =
        Math.max(
          Math.floor(
            (now -
              session.pausedAt.getTime()) /
              1000,
          ),
          0,
        );

      totalPausedSeconds +=
        currentPauseSeconds;
    }

    const elapsedSeconds = Math.max(
      totalElapsedSeconds -
        totalPausedSeconds,
      0,
    );

    return {
      session,
      elapsedSeconds,
    };
  };