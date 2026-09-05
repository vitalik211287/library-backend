import {
  getReadingGoal,
  getReadingGoalMetricsSource,
} from "../repositories/readingGoalRepository.js";

import { calculateReadingSessionMetrics } from "./readingMetricsService.js";

const getPercent = (current: number, goal: number | null) => {
  if (!goal || goal <= 0) {
    return 0;
  }

  return Math.min(Math.round((current / goal) * 100), 100);
};

export const getReadingGoalService = async (userId: string, year: number) => {
  const [goal, metricsSource] = await Promise.all([
    getReadingGoal(userId, year),

    getReadingGoalMetricsSource(userId, year),
  ]);

  const sessionMetrics = calculateReadingSessionMetrics(metricsSource.sessions);

  const books = metricsSource.finishedBooks.length;

  const pages = sessionMetrics.pages;

  const minutes = Math.floor(sessionMetrics.seconds / 60);

  const booksGoal = goal?.booksGoal ?? null;

  const pagesGoal = goal?.pagesGoal ?? null;

  const minutesGoal = goal?.minutesGoal ?? null;

  return {
    year,

    goal: {
      books: booksGoal,
      pages: pagesGoal,
      minutes: minutesGoal,
    },

    progress: {
      books,
      pages,
      minutes,
    },

    percent: {
      books: getPercent(books, booksGoal),

      pages: getPercent(pages, pagesGoal),

      minutes: getPercent(minutes, minutesGoal),
    },
  };
};

