import {
  getBookById,
  getFinishedReadingSessions,
} from "../repositories/readingRepository.js";

export const getReadingHistoryService = async (bookId: string) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const sessions = await getFinishedReadingSessions(bookId);

  const history = sessions.map((session) => {
    const pagesRead =
      session.endPage !== null
        ? session.endPage - session.startPage
        : 0;

    return {
      id: session.id,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      startPage: session.startPage,
      endPage: session.endPage,
      durationSeconds: session.durationSeconds,
      pagesRead,
    };
  });

  return {
    book: {
      id: book.id,
      title: book.title,
      currentPage: book.currentPage,
      totalPages: book.pages,
      status: book.status,
    },
    history,
  };
};