import {
  getBookById,
  getFinishedUserReadingSessions,
  getOrCreateUserBook,
} from "../repositories/userReadingRepository.js";

export const getUserReadingStatsService = async (
  userId: string,
  bookId: string,
) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const userBook = await getOrCreateUserBook(userId, bookId);

  const sessions = await getFinishedUserReadingSessions(userId, bookId);

  const totalReadingSeconds = sessions.reduce(
    (total, session) => total + Math.max(session.durationSeconds ?? 0, 0),
    0,
  );

  const pageSessions = sessions.filter(
    (session) => session.progressMode === "PAGES",
  );

  const percentSessions = sessions.filter(
    (session) => session.progressMode === "PERCENT",
  );

  const pagesRead = pageSessions.reduce((total, session) => {
    if (session.endPage === null) {
      return total;
    }

    return total + Math.max(session.endPage - session.startPage, 0);
  }, 0);

  const percentRead = percentSessions.reduce((total, session) => {
    if (session.endPercent === null) {
      return total;
    }

    const startPercent = session.startPercent ?? 0;

    return total + Math.max(session.endPercent - startPercent, 0);
  }, 0);

  const progressPercent =
    userBook.progressMode === "PERCENT"
      ? userBook.currentPercent
      : book.pages && book.pages > 0
        ? (userBook.currentPage / book.pages) * 100
        : 0;

  const pagesPerHour =
    totalReadingSeconds > 0 && pagesRead > 0
      ? pagesRead / (totalReadingSeconds / 3600)
      : 0;

  const remainingPages =
    userBook.progressMode === "PAGES" && book.pages !== null
      ? Math.max(book.pages - userBook.currentPage, 0)
      : null;

  const estimatedRemainingSeconds =
    remainingPages !== null && pagesPerHour > 0
      ? (remainingPages / pagesPerHour) * 3600
      : null;

  return {
    progressMode: userBook.progressMode,

    currentPage: userBook.currentPage,

    currentPercent: userBook.currentPercent,

    totalPages: book.pages,

    progressPercent:
      Math.round(Math.min(Math.max(progressPercent, 0), 100) * 10) / 10,

    totalReadingSeconds,

    pagesRead,

    percentRead,

    pagesPerHour: Math.round(pagesPerHour),

    remainingPages,

    estimatedRemainingSeconds:
      estimatedRemainingSeconds !== null
        ? Math.round(estimatedRemainingSeconds)
        : null,

    sessionsCount: sessions.length,

    pageSessionsCount: pageSessions.length,

    percentSessionsCount: percentSessions.length,
  };
};
