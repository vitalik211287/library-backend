import {
  createReadingSession,
  getActiveReadingSession,
  getBookById,
  setBookAsReading,
} from "../repositories/readingRepository.js";

export const startReadingService = async (bookId: string) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const activeSession = await getActiveReadingSession(bookId);

  if (activeSession) {
    throw new Error("Reading session already started");
  }

  const session = await createReadingSession(
    bookId,
    book.currentPage,
  );

  if (book.status !== "READING") {
    await setBookAsReading(bookId);
  }

  return session;
};