import {
  getAllUserReadingSessionsForStats,
  getFinishedUserBooksForStats,
  getUserReadingSessionsForStats,
} from "../repositories/userStatsRepository.js";

import {
  calculateReadingSessionMetrics,
  calculateReadingStreak,
  getFinishedBooksInRange,
  getSafeTimeZone,
} from "./readingMetricsService.js";

type GenreStat = {
  name: string;
  books: number;
  percent: number;
};

type AuthorStat = {
  name: string;
  books: number;
};

type MonthStat = {
  month: number;
  books: number;
  pages: number;
  percent: number;
  seconds: number;
};

/* =========================
   USER STATS
========================= */

export const getUserStatsService = async (
  userId: string,
  year: number,
  timeZone?: string,
) => {
  const safeTimeZone = getSafeTimeZone(timeZone);

  const from = new Date(Date.UTC(year, 0, 1));

  const to = new Date(Date.UTC(year + 1, 0, 1));

  const [yearSessions, allSessions, finishedUserBooks] = await Promise.all([
    getUserReadingSessionsForStats(userId, from, to),

    getAllUserReadingSessionsForStats(userId),

    getFinishedUserBooksForStats(userId),
  ]);

  /* =========================
     SUMMARY
  ========================= */

  const sessionMetrics = calculateReadingSessionMetrics(yearSessions);

  const finishedBooksInYear = getFinishedBooksInRange(
    finishedUserBooks,
    from,
    to,
  );

  const finishedBooks = finishedBooksInYear.length;

  /* =========================
     AVERAGE RATING
  ========================= */

  const ratings = finishedUserBooks
    .map((item) => item.rating)
    .filter((rating): rating is number => typeof rating === "number");

  const averageRating =
    ratings.length > 0
      ? Math.round(
          (ratings.reduce((total, rating) => total + rating, 0) /
            ratings.length) *
            10,
        ) / 10
      : 0;

  /* =========================
     MONTHS
  ========================= */

  const months: MonthStat[] = Array.from(
    {
      length: 12,
    },
    (_, index) => ({
      month: index + 1,
      books: 0,
      pages: 0,
      percent: 0,
      seconds: 0,
    }),
  );

  for (const session of yearSessions) {
    const month = session.startedAt.getUTCMonth();

    const monthStat = months[month];

    if (!monthStat) {
      continue;
    }

    if (session.progressMode === "PAGES" && session.endPage !== null) {
      monthStat.pages += Math.max(session.endPage - session.startPage, 0);
    }

    if (session.progressMode === "PERCENT" && session.endPercent !== null) {
      const startPercent = session.startPercent ?? 0;

      monthStat.percent += Math.max(session.endPercent - startPercent, 0);
    }

    monthStat.seconds += Math.max(session.durationSeconds ?? 0, 0);
  }

  for (const item of finishedBooksInYear) {
    if (!item.finishedAt) {
      continue;
    }

    const month = item.finishedAt.getUTCMonth();

    const monthStat = months[month];

    if (!monthStat) {
      continue;
    }

    monthStat.books += 1;
  }

  /* =========================
     GENRES
  ========================= */

  const genreMap = new Map<string, number>();

  for (const item of finishedUserBooks) {
    const genre = item.book.genre?.trim() || "Без жанру";

    genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1);
  }

  const totalGenreBooks = finishedUserBooks.length;

  const genres: GenreStat[] = Array.from(genreMap.entries())
    .map(([name, books]) => ({
      name,
      books,

      percent:
        totalGenreBooks > 0 ? Math.round((books / totalGenreBooks) * 100) : 0,
    }))
    .sort((a, b) => b.books - a.books);

  /* =========================
     AUTHORS
  ========================= */

  const authorMap = new Map<string, number>();

  for (const item of finishedUserBooks) {
    const author = item.book.author?.trim();

    if (!author) {
      continue;
    }

    authorMap.set(author, (authorMap.get(author) ?? 0) + 1);
  }

  const authors: AuthorStat[] = Array.from(authorMap.entries())
    .map(([name, books]) => ({
      name,
      books,
    }))
    .sort((a, b) => b.books - a.books)
    .slice(0, 10);

  /* =========================
     STREAK
  ========================= */

  const activityDates = allSessions.map((session) => session.startedAt);

  const streak = calculateReadingStreak(activityDates, safeTimeZone);

  /* =========================
     RESULT
  ========================= */

  return {
    year,

    summary: {
      finishedBooks,

      pagesRead: sessionMetrics.pages,

      percentRead: sessionMetrics.percent,

      readingSeconds: sessionMetrics.seconds,

      averageRating,

      sessions: sessionMetrics.sessions,

      pageSessions: sessionMetrics.pageSessions,

      percentSessions: sessionMetrics.percentSessions,

      averageSessionSeconds: sessionMetrics.averageSessionSeconds,

      pagesPerHour: sessionMetrics.pagesPerHour,
    },

    streak,

    genres,

    authors,

    months,
  };
};

