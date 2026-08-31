import prisma from "../utils/prisma.js";
import type { ProgressMode, ReadingStatus } from "@prisma/client";

export const getBookById = async (bookId: string) => {
  return prisma.book.findUnique({
    where: {
      id: bookId,
    },
  });
};

export const getUserBook = async (userId: string, bookId: string) => {
  return prisma.userBook.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
  });
};

export const getOrCreateUserBook = async (userId: string, bookId: string) => {
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

type CreateReadingSessionData = {
  progressMode: ProgressMode;
  startPage?: number;
  startPercent?: number;
};

export const createUserReadingSession = async (
  userId: string,
  bookId: string,
  data: CreateReadingSessionData,
) => {
  return prisma.readingSession.create({
    data: {
      userId,
      bookId,

      progressMode: data.progressMode,

      startPage: data.progressMode === "PAGES" ? (data.startPage ?? 0) : 0,

      startPercent:
        data.progressMode === "PERCENT" ? (data.startPercent ?? 0) : null,

      startedAt: new Date(),
    },
  });
};

export const pauseUserReadingSession = async (sessionId: string) => {
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
    Math.floor((Date.now() - pausedAt.getTime()) / 1000),
    0,
  );

  return prisma.readingSession.update({
    where: {
      id: sessionId,
    },

    data: {
      pausedAt: null,

      pausedSeconds: pausedSeconds + currentPauseSeconds,
    },
  });
};

type FinishReadingSessionData = {
  progressMode: ProgressMode;
  endPage?: number;
  endPercent?: number;
  durationSeconds: number;
  pausedSeconds: number;
};

export const finishUserReadingSession = async (
  sessionId: string,
  data: FinishReadingSessionData,
) => {
  return prisma.readingSession.update({
    where: {
      id: sessionId,
    },

    data: {
      progressMode: data.progressMode,

      endPage: data.progressMode === "PAGES" ? (data.endPage ?? null) : null,

      endPercent:
        data.progressMode === "PERCENT" ? (data.endPercent ?? null) : null,

      durationSeconds: data.durationSeconds,

      pausedSeconds: data.pausedSeconds,

      finishedAt: new Date(),
      pausedAt: null,
    },
  });
};

type UpdateReadingProgressData = {
  progressMode?: ProgressMode;
  currentPage?: number;
  currentPercent?: number;
  status: ReadingStatus;
};

export const updateUserReadingProgress = async (
  userId: string,
  bookId: string,
  data: UpdateReadingProgressData,
) => {
  const userBook = await prisma.userBook.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
  });

  const finishedAt =
    data.status === "FINISHED" ? (userBook?.finishedAt ?? new Date()) : null;

  return prisma.userBook.update({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },

    data: {
      ...(data.progressMode !== undefined && {
        progressMode: data.progressMode,
      }),

      ...(data.currentPage !== undefined && {
        currentPage: data.currentPage,
      }),

      ...(data.currentPercent !== undefined && {
        currentPercent: data.currentPercent,
      }),

      status: data.status,
      isWishlist: false,
      finishedAt,
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

export const createImportedReadingSession = async (
  userId: string,
  bookId: string,
  startedAt: Date,
  finishedAt: Date,
  startPage: number,
  endPage: number,
  durationSeconds: number,
) => {
  return prisma.readingSession.create({
    data: {
      userId,
      bookId,
      startedAt,
      finishedAt,
      startPage,
      endPage,
      durationSeconds,
      pausedSeconds: 0,
      pausedAt: null,
    },
  });
};

export const getFinishedUserBooks = async (
  userId: string,
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;

  const [userBooks, total] = await prisma.$transaction([
    prisma.userBook.findMany({
      where: {
        userId,
        status: "FINISHED",
      },

      include: {
        book: true,
      },

      orderBy: [
        {
          finishedAt: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],

      skip,
      take: limit,
    }),

    prisma.userBook.count({
      where: {
        userId,
        status: "FINISHED",
      },
    }),
  ]);

  return {
    userBooks,
    total,
  };
};

export const getWishlistUserBooks = async (userId: string) => {
  return prisma.userBook.findMany({
    where: {
      userId,
      isWishlist: true,
    },

    include: {
      book: true,
    },

    orderBy: {
      updatedAt: "desc",
    },
  });
};

export const addUserBookToWishlist = async (userId: string, bookId: string) => {
  return prisma.userBook.upsert({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },

    update: {
      isWishlist: true,
    },

    create: {
      userId,
      bookId,
      isWishlist: true,
    },

    include: {
      book: true,
    },
  });
};

export const removeUserBookFromWishlist = async (
  userId: string,
  bookId: string,
) => {
  return prisma.userBook.update({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },

    data: {
      isWishlist: false,
    },

    include: {
      book: true,
    },
  });
};

export const getCurrentUserBooks = async (userId: string) => {
  return prisma.userBook.findMany({
    where: {
      userId,

      status: {
        in: ["READING", "PAUSED"],
      },
    },

    include: {
      book: true,
    },

    orderBy: {
      updatedAt: "desc",
    },
  });
};
