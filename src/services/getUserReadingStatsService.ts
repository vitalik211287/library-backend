import {
  getBookById,
  getFinishedUserReadingSessions,
  getOrCreateUserBook,
} from "../repositories/userReadingRepository.js";

export const getUserReadingStatsService =
  async (
    userId: string,
    bookId: string,
  ) => {
    const book = await getBookById(bookId);

    if (!book) {
      throw new Error("Book not found");
    }

    const userBook =
      await getOrCreateUserBook(
        userId,
        bookId,
      );

    const sessions =
      await getFinishedUserReadingSessions(
        userId,
        bookId,
      );

    const totalReadingSeconds =
      sessions.reduce(
        (total, session) =>
          total +
          (session.durationSeconds ?? 0),
        0,
      );

    const pagesRead = sessions.reduce(
      (total, session) => {
        if (session.endPage === null) {
          return total;
        }

        return (
          total +
          (session.endPage -
            session.startPage)
        );
      },
      0,
    );

    const progressPercent =
      book.pages && book.pages > 0
        ? (userBook.currentPage /
            book.pages) *
          100
        : 0;

    const pagesPerHour =
      totalReadingSeconds > 0
        ? pagesRead /
          (totalReadingSeconds / 3600)
        : 0;

    const remainingPages =
      book.pages !== null
        ? Math.max(
            book.pages -
              userBook.currentPage,
            0,
          )
        : null;

    const estimatedRemainingSeconds =
      remainingPages !== null &&
      pagesPerHour > 0
        ? (remainingPages /
            pagesPerHour) *
          3600
        : null;

    return {
      currentPage:
        userBook.currentPage,

      totalPages:
        book.pages,

      progressPercent:
        Math.round(
          progressPercent * 10,
        ) / 10,

      totalReadingSeconds,

      pagesRead,

      pagesPerHour:
        Math.round(pagesPerHour),

      remainingPages,

      estimatedRemainingSeconds:
        estimatedRemainingSeconds !==
        null
          ? Math.round(
              estimatedRemainingSeconds,
            )
          : null,

      sessionsCount:
        sessions.length,
    };
  };