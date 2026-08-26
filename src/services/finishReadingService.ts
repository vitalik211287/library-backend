import {
  finishReadingSession,
  getActiveReadingSession,
  getBookById,
  updateBookCurrentPage,
  setBookAsFinished,
} from "../repositories/readingRepository.js";

export const finishReadingService = async (bookId: string, endPage: number) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const activeSession = await getActiveReadingSession(bookId);

  if (!activeSession) {
    throw new Error("Active reading session not found");
  }

  if (endPage < activeSession.startPage) {
    throw new Error("End page cannot be less than start page");
  }

  if (book.pages && endPage > book.pages) {
    throw new Error("End page cannot be greater than total pages");
  }

  const finishedAt = new Date();

  const durationSeconds = Math.floor(
    (finishedAt.getTime() - activeSession.startedAt.getTime()) / 1000,
  );

  const session = await finishReadingSession(
    activeSession.id,
    endPage,
    durationSeconds,
  );

  await updateBookCurrentPage(bookId, endPage);

  if (book.pages && endPage >= book.pages) {
    await setBookAsFinished(bookId);
  }
  
  return session;
};
