import { getBookById } from "../../books/repositories/booksRepository.js";

import { getOrCreateUserBook } from "../../user-books/repositories/userBooksRepository.js";

import { getFinishedUserReadingSessions } from "../repositories/userReadingRepository.js";

import { calculateReadingSessionMetrics } from "../../stats/services/readingMetricsService.js";

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

  const sessionMetrics = calculateReadingSessionMetrics(sessions);

  const percentReadingSeconds = sessions
    .filter((session) => session.progressMode === "PERCENT")
    .reduce(
      (total, session) => total + Math.max(session.durationSeconds ?? 0, 0),
      0,
    );

  const totalReadingSeconds = sessionMetrics.seconds;
  const pagesRead = sessionMetrics.pages;
  const percentRead = sessionMetrics.percent;
  const pagesPerHour = sessionMetrics.pagesPerHour;

  /* =========================
     ПОТОЧНИЙ ПРОГРЕС
  ========================= */

  const progressPercent =
    userBook.progressMode === "PERCENT"
      ? userBook.currentPercent
      : book.pages && book.pages > 0
        ? (userBook.currentPage / book.pages) * 100
        : 0;

  /* =========================
     ШВИДКІСТЬ — ВІДСОТКИ
  ========================= */

  const percentPerHour =
    percentReadingSeconds > 0 && percentRead > 0
      ? percentRead / (percentReadingSeconds / 3600)
      : 0;

  /* =========================
     ЗАЛИШИЛОСЬ
  ========================= */

  const remainingPages =
    userBook.progressMode === "PAGES" && book.pages !== null
      ? Math.max(book.pages - userBook.currentPage, 0)
      : null;

  const remainingPercent =
    userBook.progressMode === "PERCENT"
      ? Math.max(100 - userBook.currentPercent, 0)
      : null;

  /* =========================
     ОРІЄНТОВНИЙ ЧАС
  ========================= */

  let estimatedRemainingSeconds: number | null = null;

  if (
    userBook.progressMode === "PAGES" &&
    remainingPages !== null &&
    pagesPerHour > 0
  ) {
    estimatedRemainingSeconds = (remainingPages / pagesPerHour) * 3600;
  }

  if (
    userBook.progressMode === "PERCENT" &&
    remainingPercent !== null &&
    percentPerHour > 0
  ) {
    estimatedRemainingSeconds = (remainingPercent / percentPerHour) * 3600;
  }

  /* =========================
     НАЙДОВША СЕСІЯ
  ========================= */

  const longestSessionSeconds = sessions.reduce(
    (longest, session) => Math.max(longest, session.durationSeconds ?? 0),
    0,
  );

  return {
    progressMode: userBook.progressMode,

    currentPage: userBook.currentPage,

    currentPercent: userBook.currentPercent,

    totalPages: book.pages,

    progressPercent:
      Math.round(Math.min(Math.max(progressPercent, 0), 100) * 10) / 10,

    totalReadingSeconds,

    pagesRead,

    percentRead: Math.round(percentRead * 10) / 10,

    pagesPerHour,

    percentPerHour: Math.round(percentPerHour * 10) / 10,

    remainingPages,

    remainingPercent:
      remainingPercent !== null ? Math.round(remainingPercent * 10) / 10 : null,

    estimatedRemainingSeconds:
      estimatedRemainingSeconds !== null
        ? Math.round(estimatedRemainingSeconds)
        : null,

    sessionsCount: sessionMetrics.sessions,

    pageSessionsCount: sessionMetrics.pageSessions,

    percentSessionsCount: sessionMetrics.percentSessions,

    longestSessionSeconds,
  };
};
