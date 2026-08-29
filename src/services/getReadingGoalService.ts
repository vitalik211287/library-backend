import {
  getReadingGoal,
  getReadingGoalProgress,
} from "../repositories/readingGoalRepository.js";

const getPercent = (current: number, goal: number | null) => {
  if (!goal || goal <= 0) {
    return 0;
  }

  return Math.min(Math.round((current / goal) * 100), 100);
};

export const getReadingGoalService = async (userId: string, year: number) => {
  const [goal, progress] = await Promise.all([
    getReadingGoal(userId, year),

    getReadingGoalProgress(userId, year),
  ]);

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
      books: progress.books,

      pages: progress.pages,

      minutes: progress.minutes,
    },

    percent: {
      books: getPercent(progress.books, booksGoal),

      pages: getPercent(progress.pages, pagesGoal),

      minutes: getPercent(progress.minutes, minutesGoal),
    },
  };
};
