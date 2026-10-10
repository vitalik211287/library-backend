import prisma from "../../../utils/prisma.js";

import type { Prisma, ProgressMode } from "@prisma/client";

import { getTotalPausedSeconds } from "../utils/readingSessionTime.js";

type DbClient = Prisma.TransactionClient | typeof prisma;

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
  source: "MANUAL" | "EBOOK";
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
      source: data.source,

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
  const totalPausedSeconds = getTotalPausedSeconds(
    pausedSeconds,
    pausedAt,
    new Date(),
  );

  return prisma.readingSession.update({
    where: {
      id: sessionId,
    },

    data: {
      pausedAt: null,

      pausedSeconds: totalPausedSeconds,
    },
  });
};

type FinishReadingSessionData = {
  progressMode: ProgressMode;
  endPage?: number;
  endPercent?: number;
  epubStartPositionPercent?: number;
  epubEndPositionPercent?: number;
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

      ...(data.epubStartPositionPercent !== undefined && {
        epubStartPositionPercent: data.epubStartPositionPercent,
      }),
      ...(data.epubEndPositionPercent !== undefined && {
        epubEndPositionPercent: data.epubEndPositionPercent,
      }),

      durationSeconds: data.durationSeconds,

      pausedSeconds: data.pausedSeconds,

      finishedAt: new Date(),
      pausedAt: null,
    },
  });
};

export const getAllFinishedUserReadingSessions = async (userId: string) => {
  return prisma.readingSession.findMany({
    where: {
      userId,
      finishedAt: {
        not: null,
      },
    },

    include: {
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          coverUrl: true,
          pages: true,
        },
      },
    },

    orderBy: {
      startedAt: "desc",
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

export const getUserReadingSessionById = async (
  userId: string,
  bookId: string,
  sessionId: string,
  db: DbClient = prisma,
) => {
  return db.readingSession.findFirst({
    where: {
      id: sessionId,
      userId,
      bookId,

      finishedAt: {
        not: null,
      },
    },
  });
};

type UpdateReadingSessionProgressData = {
  endPage?: number;
  endPercent?: number;
};

export const updateUserReadingSessionProgress = async (
  sessionId: string,
  data: UpdateReadingSessionProgressData,
  db: DbClient = prisma,
) => {
  return db.readingSession.update({
    where: {
      id: sessionId,
    },

    data: {
      ...(data.endPage !== undefined && {
        endPage: data.endPage,
      }),

      ...(data.endPercent !== undefined && {
        endPercent: data.endPercent,
      }),
    },
  });
};

export const deleteUserReadingSession = async (
  sessionId: string,
  db: DbClient = prisma,
) => {
  return db.readingSession.delete({
    where: {
      id: sessionId,
    },
  });
};

export const getLatestFinishedUserReadingSession = async (
  userId: string,
  bookId: string,
  db: DbClient = prisma,
) => {
  return db.readingSession.findFirst({
    where: {
      userId,
      bookId,

      finishedAt: {
        not: null,
      },
    },

    orderBy: {
      finishedAt: "desc",
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
