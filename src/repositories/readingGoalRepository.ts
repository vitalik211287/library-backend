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

export const getReadingGoalProgress = async (userId: string, year: number) => {
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

      include: {
        book: true,
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
        startPage: true,
        endPage: true,
        durationSeconds: true,
      },
    }),
  ]);

  const pages = sessions.reduce((total, session) => {
    if (session.endPage === null) {
      return total;
    }

    return total + Math.max(session.endPage - session.startPage, 0);
  }, 0);

  const seconds = sessions.reduce(
    (total, session) => total + Math.max(session.durationSeconds ?? 0, 0),
    0,
  );

  return {
    books: finishedBooks.length,

    pages,

    minutes: Math.floor(seconds / 60),
  };
};
