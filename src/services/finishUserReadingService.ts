import {
  finishUserReadingSession,
  getActiveUserReadingSession,
  getBookById,
  updateUserReadingProgress,
} from "../repositories/userReadingRepository.js";

export const finishUserReadingService = async (
  userId: string,
  bookId: string,
  endPage: number,
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
    throw new Error(
      "No active reading session",
    );
  }

  if (!Number.isInteger(endPage)) {
    throw new Error("Invalid end page");
  }

  if (endPage < session.startPage) {
    throw new Error(
      "End page cannot be less than start page",
    );
  }

  if (
    book.pages !== null &&
    endPage > book.pages
  ) {
    throw new Error(
      "End page exceeds total book pages",
    );
  }

  const totalElapsedSeconds = Math.max(
    Math.floor(
      (Date.now() -
        session.startedAt.getTime()) /
        1000,
    ),
    0,
  );

  let totalPausedSeconds =
    session.pausedSeconds;

  /*
   * Якщо користувач завершує сесію,
   * поки вона стоїть на паузі,
   * додаємо ще поточну незавершену паузу.
   */
  if (session.pausedAt) {
    const currentPauseSeconds =
      Math.max(
        Math.floor(
          (Date.now() -
            session.pausedAt.getTime()) /
            1000,
        ),
        0,
      );

    totalPausedSeconds +=
      currentPauseSeconds;
  }

  /*
   * Реальний час читання =
   * весь час сесії - весь час пауз.
   */
  const durationSeconds = Math.max(
    totalElapsedSeconds -
      totalPausedSeconds,
    0,
  );

  const finishedSession =
    await finishUserReadingSession(
      session.id,
      endPage,
      durationSeconds,
    );

  const status =
    book.pages !== null &&
    endPage >= book.pages
      ? "FINISHED"
      : "READING";

  await updateUserReadingProgress(
    userId,
    bookId,
    endPage,
    status,
  );

  return finishedSession;
};