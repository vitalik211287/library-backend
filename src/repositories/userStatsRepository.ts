import prisma from "../utils/prisma.js";

export const getUserReadingSessionsForStats =
  async (
    userId: string,
    from: Date,
    to: Date,
  ) => {
    return prisma.readingSession.findMany({
      where: {
        userId,

        finishedAt: {
          not: null,
        },

        startedAt: {
          gte: from,
          lt: to,
        },
      },

      include: {
        book: true,
      },

      orderBy: {
        startedAt: "asc",
      },
    });
  };

export const getAllUserReadingSessionsForStats =
  async (
    userId: string,
  ) => {
    return prisma.readingSession.findMany({
      where: {
        userId,

        finishedAt: {
          not: null,
        },
      },

      include: {
        book: true,
      },

      orderBy: {
        startedAt: "asc",
      },
    });
  };

export const getFinishedUserBooksForStats =
  async (
    userId: string,
  ) => {
    return prisma.userBook.findMany({
      where: {
        userId,
        status: "FINISHED",
      },

      include: {
        book: true,
      },
    });
  };

/* =========================
   MONTH ACTIVITY
========================= */

export const getUserReadingSessionsForMonth =
  async (
    userId: string,
    from: Date,
    to: Date,
  ) => {
    return prisma.readingSession.findMany({
      where: {
        userId,

        finishedAt: {
          not: null,
        },

        startedAt: {
          gte: from,
          lt: to,
        },
      },

      include: {
        book: true,
      },

      orderBy: {
        startedAt: "asc",
      },
    });
  };