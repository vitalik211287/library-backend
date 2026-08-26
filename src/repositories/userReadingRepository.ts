import prisma from "../utils/prisma.js";

export const getBookById = async (bookId: string) => {
  return prisma.book.findUnique({
    where: {
      id: bookId,
    },
  });
};

export const getUserBook = async (
  userId: string,
  bookId: string,
) => {
  return prisma.userBook.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
  });
};

export const getOrCreateUserBook = async (
  userId: string,
  bookId: string,
) => {
  return prisma.userBook.upsert({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },

    update: {},

    create: {
      userId,
      bookId,
    },
  });
};

export const getActiveUserReadingSession = async (
  userId: string,
  bookId: string,
) => {
  return prisma.readingSession.findFirst({
    where: {
      userId,
      bookId,
      finishedAt: null,
    },

    orderBy: {
      startedAt: "desc",
    },
  });
};

export const createUserReadingSession = async (
  userId: string,
  bookId: string,
  startPage: number,
) => {
  return prisma.readingSession.create({
    data: {
      userId,
      bookId,
      startPage,
      startedAt: new Date(),
    },
  });
};

export const pauseUserReadingSession = async (
  sessionId: string,
) => {
  return prisma.readingSession.update({
    where: {
      id: sessionId,
    },

    data: {
      pausedAt: new Date(),
    },
  });
};

export const resumeUserReadingSession = async (
  sessionId: string,
  pausedAt: Date,
  pausedSeconds: number,
) => {
  const currentPauseSeconds = Math.max(
    Math.floor(
      (Date.now() - pausedAt.getTime()) /
        1000,
    ),
    0,
  );

  return prisma.readingSession.update({
    where: {
      id: sessionId,
    },

    data: {
      pausedAt: null,

      pausedSeconds:
        pausedSeconds +
        currentPauseSeconds,
    },
  });
};

export const finishUserReadingSession = async (
  sessionId: string,
  endPage: number,
  durationSeconds: number,
) => {
  return prisma.readingSession.update({
    where: {
      id: sessionId,
    },

    data: {
      endPage,
      durationSeconds,
      finishedAt: new Date(),
      pausedAt: null,
    },
  });
};

export const updateUserReadingProgress = async (
  userId: string,
  bookId: string,
  currentPage: number,
  status: "READING" | "FINISHED",
) => {
  return prisma.userBook.update({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },

    data: {
      currentPage,
      status,
    },
  });
};

export const getFinishedUserReadingSessions = async (
  userId: string,
  bookId: string,
) => {
  return prisma.readingSession.findMany({
    where: {
      userId,
      bookId,
      finishedAt: {
        not: null,
      },
    },

    orderBy: {
      startedAt: "asc",
    },
  });
};