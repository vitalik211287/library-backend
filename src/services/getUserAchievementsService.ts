import {
  getAllUserReadingSessionsForStats,
  getFinishedUserBooksForStats,
} from "../repositories/userStatsRepository.js";

type AchievementCategory = "books" | "pages" | "time" | "streak";

type AchievementConfig = {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  target: number;
};

type Achievement = AchievementConfig & {
  current: number;
  percent: number;
  unlocked: boolean;
};

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const ACHIEVEMENTS: AchievementConfig[] = [
  {
    id: "books-1",
    category: "books",
    title: "Перший крок",
    description: "Прочитай першу книгу",
    target: 1,
  },
  {
    id: "books-5",
    category: "books",
    title: "Книжковий старт",
    description: "Прочитай 5 книг",
    target: 5,
  },
  {
    id: "books-10",
    category: "books",
    title: "Книголюб",
    description: "Прочитай 10 книг",
    target: 10,
  },
  {
    id: "books-25",
    category: "books",
    title: "Бібліофіл",
    description: "Прочитай 25 книг",
    target: 25,
  },

  {
    id: "pages-1000",
    category: "pages",
    title: "Тисяча сторінок",
    description: "Прочитай 1000 сторінок",
    target: 1000,
  },
  {
    id: "pages-5000",
    category: "pages",
    title: "П'ять тисяч",
    description: "Прочитай 5000 сторінок",
    target: 5000,
  },
  {
    id: "pages-10000",
    category: "pages",
    title: "Десять тисяч",
    description: "Прочитай 10000 сторінок",
    target: 10000,
  },

  {
    id: "time-10",
    category: "time",
    title: "10 годин читання",
    description: "Проведи за читанням 10 годин",
    target: 10 * 60 * 60,
  },
  {
    id: "time-50",
    category: "time",
    title: "50 годин читання",
    description: "Проведи за читанням 50 годин",
    target: 50 * 60 * 60,
  },
  {
    id: "time-100",
    category: "time",
    title: "100 годин читання",
    description: "Проведи за читанням 100 годин",
    target: 100 * 60 * 60,
  },

  {
    id: "streak-7",
    category: "streak",
    title: "Тиждень у ритмі",
    description: "Читай 7 днів поспіль",
    target: 7,
  },
  {
    id: "streak-30",
    category: "streak",
    title: "Невтомний читач",
    description: "Читай 30 днів поспіль",
    target: 30,
  },
];

const calculateLongestStreak = (dates: Date[]) => {
  if (dates.length === 0) {
    return 0;
  }

  const uniqueDays = [
    ...new Set(
      dates.map((date) =>
        Math.floor(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
          ) / MILLISECONDS_PER_DAY,
        ),
      ),
    ),
  ].sort((a, b) => a - b);

  let longest = 1;
  let current = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previousDay = uniqueDays[index - 1];

    const currentDay = uniqueDays[index];

    if (previousDay === undefined || currentDay === undefined) {
      continue;
    }

    if (currentDay === previousDay + 1) {
      current += 1;
    } else {
      current = 1;
    }

    longest = Math.max(longest, current);
  }

  return longest;
};

const getAchievementCurrentValue = (
  category: AchievementCategory,
  data: {
    books: number;
    pages: number;
    seconds: number;
    streak: number;
  },
) => {
  switch (category) {
    case "books":
      return data.books;

    case "pages":
      return data.pages;

    case "time":
      return data.seconds;

    case "streak":
      return data.streak;

    default:
      return 0;
  }
};

export const getUserAchievementsService = async (userId: string) => {
  const [sessions, finishedBooks] = await Promise.all([
    getAllUserReadingSessionsForStats(userId),

    getFinishedUserBooksForStats(userId),
  ]);

  const totalBooks = finishedBooks.length;

  const totalPages = sessions.reduce((total, session) => {
    if (session.progressMode !== "PAGES" || session.endPage === null) {
      return total;
    }

    return total + Math.max(session.endPage - session.startPage, 0);
  }, 0);

  const totalSeconds = sessions.reduce(
    (total, session) => total + Math.max(session.durationSeconds ?? 0, 0),
    0,
  );

  const longestStreak = calculateLongestStreak(
    sessions.map((session) => session.startedAt),
  );

  const values = {
    books: totalBooks,

    pages: totalPages,

    seconds: totalSeconds,

    streak: longestStreak,
  };

  const achievements: Achievement[] = ACHIEVEMENTS.map((achievement) => {
    const current = getAchievementCurrentValue(achievement.category, values);

    const percent =
      achievement.target > 0
        ? Math.min(Math.round((current / achievement.target) * 100), 100)
        : 0;

    return {
      ...achievement,

      current,

      percent,

      unlocked: current >= achievement.target,
    };
  });

  const unlocked = achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;

  return {
    summary: {
      total: achievements.length,

      unlocked,

      locked: achievements.length - unlocked,
    },

    achievements,
  };
};
