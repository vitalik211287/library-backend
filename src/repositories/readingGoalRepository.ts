import prisma from "../utils/prisma.js";

export type ReadingGoalData = {
  booksGoal?: number | null;
  pagesGoal?: number | null;
  minutesGoal?: number | null;
};

export const getReadingGoal = async (userId: string, year: number) => {
  return prisma.readingGoal.findUnique({
    where: {
      userId_year: {
        userId,
        year,
      },
    },
  });
};

export const upsertReadingGoal = async (
  userId: string,
  year: number,
  data: ReadingGoalData,
) => {
  return prisma.readingGoal.upsert({
    where: {
      userId_year: {
        userId,
        year,
      },
    },

    update: data,

    create: {
      userId,
      year,
      ...data,
    },
  });
};

/* =========================
   GOAL METRICS SOURCE
========================= */

export const getReadingGoalMetricsSource = async (
  userId: string,
  year: number,
) => {
  const from = new Date(Date.UTC(year, 0, 1));

  const to = new Date(Date.UTC(year + 1, 0, 1));

  const [finishedBooks, sessions] = await prisma.$transaction([
    prisma.userBook.findMany({
      where: {
        userId,

        status: "FINISHED",

        finishedAt: {
          gte: from,
          lt: to,
        },
      },

      select: {
        id: true,
        finishedAt: true,
      },
    }),

    prisma.readingSession.findMany({
      where: {
        userId,

        finishedAt: {
          gte: from,
          lt: to,
        },
      },

      select: {
        progressMode: true,

        startPage: true,
        endPage: true,

        startPercent: true,
        endPercent: true,

        durationSeconds: true,

        startedAt: true,
      },
    }),
  ]);

  return {
    finishedBooks,
    sessions,
  };
};
