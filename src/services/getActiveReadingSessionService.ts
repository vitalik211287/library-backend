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

  return getActiveReadingSession(bookId);
};