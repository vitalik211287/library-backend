import {
  getActiveReadingSession,
  getBookById,
} from "../repositories/readingRepository.js";

export const getActiveReadingSessionService = async (
  bookId: string,
) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const session = await getActiveReadingSession(bookId);

  if (!session) {
    return {
      session: null,
      elapsedSeconds: 0,
    };
  }

  const elapsedSeconds = Math.max(
    Math.floor(
      (Date.now() - session.startedAt.getTime()) / 1000,
    ),
    0,
  );

  return {
    session,
    elapsedSeconds,
  };
};