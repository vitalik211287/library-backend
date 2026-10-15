import { randomUUID } from "node:crypto";
import prisma from "../../../utils/prisma.js";

import type { Prisma, ProgressMode } from "@prisma/client";

import { getTotalPausedSeconds } from "../utils/readingSessionTime.js";
import { calculateVerifiedEbookSeconds } from "../utils/ebookHeartbeatTime.js";

type DbClient = Prisma.TransactionClient | typeof prisma;

export const getActiveUserReadingSession = async (
  userId: string,
  bookId: string,
  db: DbClient = prisma,
) => {
  return db.readingSession.findFirst({
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
  const startedAt = new Date();

  return prisma.readingSession.create({
    data: {
      userId,
      bookId,

      progressMode: data.progressMode,
      source: data.source,

      startPage: data.progressMode === "PAGES" ? (data.startPage ?? 0) : 0,

      startPercent:
        data.progressMode === "PERCENT" ? (data.startPercent ?? 0) : null,

      startedAt,
      ...(data.source === "EBOOK" && {
        lastHeartbeatAt: startedAt,
        verifiedSeconds: 0,
        readerLeaseId: randomUUID(),
      }),
    },
  });
};


export const recordUserEbookHeartbeat = async (
  userId: string,
  bookId: string,
  sessionId: string,
  readerLeaseId: string,
) => {
  // Compare-and-swap prevents concurrent heartbeats from double-counting.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const session = await getActiveUserReadingSession(userId, bookId);

    if (
      !session ||
      session.id !== sessionId ||
      session.source !== "EBOOK" ||
      session.progressMode !== "PERCENT" ||
      session.pausedAt !== null ||
      session.lastHeartbeatAt === null ||
      session.verifiedSeconds === null ||
      session.readerLeaseId !== readerLeaseId
    ) {
      throw new Error("No active heartbeat-enabled EPUB session");
    }

    const now = new Date();

    const nextSeconds = calculateVerifiedEbookSeconds({
      verifiedSeconds: session.verifiedSeconds,
      lastHeartbeatAt: session.lastHeartbeatAt,
      pausedAt: session.pausedAt,
      now,
    });

    if (nextSeconds === null) {
      throw new Error("Invalid EPUB heartbeat state");
    }

    const updated = await prisma.readingSession.updateMany({
      where: {
        id: session.id,
        userId,
        bookId,
        source: "EBOOK",
        progressMode: "PERCENT",
        finishedAt: null,
        pausedAt: null,
        lastHeartbeatAt: session.lastHeartbeatAt,
        verifiedSeconds: session.verifiedSeconds,
        readerLeaseId,
      },
      data: {
        verifiedSeconds: nextSeconds,
        lastHeartbeatAt: now,
      },
    });

    if (updated.count === 1) {
      return {
        sessionId: session.id,
        verifiedSeconds: nextSeconds,
        lastHeartbeatAt: now,
      };
    }
  }

  throw new Error("EPUB heartbeat update conflict");
};



export const claimUserEbookSession = async (
  userId: string,
  bookId: string,
  sessionId: string,
  db: DbClient = prisma,
) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const session = await getActiveUserReadingSession(userId, bookId, db);

    if (
      !session ||
      session.id !== sessionId ||
      session.source !== "EBOOK" ||
      session.progressMode !== "PERCENT" ||
      session.lastHeartbeatAt === null ||
      session.verifiedSeconds === null ||
      session.readerLeaseId === null
    ) {
      throw new Error("No recoverable EPUB session");
    }

    const now = new Date();

    // Paused sessions may be reclaimed immediately.
    // Running sessions require at least two minutes of inactivity.
    if (
      session.pausedAt === null &&
      now.getTime() - session.lastHeartbeatAt.getTime() < 120000
    ) {
      throw new Error("EPUB session is still active");
    }

    const verifiedSeconds = calculateVerifiedEbookSeconds({
      verifiedSeconds: session.verifiedSeconds,
      lastHeartbeatAt: session.lastHeartbeatAt,
      pausedAt: session.pausedAt,
      now,
    });

    if (verifiedSeconds === null) {
      throw new Error("Invalid EPUB session time");
    }

    const pausedSeconds = session.pausedAt
      ? getTotalPausedSeconds(
          session.pausedSeconds,
          session.pausedAt,
          now,
        )
      : session.pausedSeconds;

    const readerLeaseId = randomUUID();

    // Only one concurrent recovery can succeed.
    // A concurrent heartbeat, pause, finish or claim must not
    // silently transfer ownership twice.
    const result = await db.readingSession.updateMany({
      where: {
        id: session.id,
        userId,
        bookId,
        source: "EBOOK",
        progressMode: "PERCENT",
        finishedAt: null,
        pausedAt: session.pausedAt,
        pausedSeconds: session.pausedSeconds,
        lastHeartbeatAt: session.lastHeartbeatAt,
        verifiedSeconds: session.verifiedSeconds,
        readerLeaseId: session.readerLeaseId,
      },
      data: {
        readerLeaseId,
        lastHeartbeatAt: now,
        verifiedSeconds,
        pausedSeconds,
        pausedAt: null,
      },
    });

    if (result.count === 1) {
      const claimedSession =
        await db.readingSession.findUniqueOrThrow({
          where: { id: session.id },
        });

      return {
        session: claimedSession,
        readerLeaseId,
      };
    }
  }

  throw new Error("EPUB recovery conflict");
};

export const pauseTrackedEbookReadingSession = async (
  userId: string,
  bookId: string,
  sessionId: string,
  readerLeaseId?: string,
  db: DbClient = prisma,
) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const session = await getActiveUserReadingSession(userId, bookId, db);

    if (
      !session ||
      session.id !== sessionId ||
      session.source !== "EBOOK" ||
      session.progressMode !== "PERCENT" ||
      session.pausedAt !== null ||
      session.lastHeartbeatAt === null ||
      session.verifiedSeconds === null ||
      session.readerLeaseId !== (readerLeaseId ?? null)
    ) {
      throw new Error("No active EPUB session to pause");
    }

    const now = new Date();

    const verifiedSeconds = calculateVerifiedEbookSeconds({
      verifiedSeconds: session.verifiedSeconds,
      lastHeartbeatAt: session.lastHeartbeatAt,
      pausedAt: session.pausedAt,
      now,
    });

    if (verifiedSeconds === null) {
      throw new Error("Invalid EPUB session time");
    }

    const result = await db.readingSession.updateMany({
      where: {
        id: sessionId,
        userId,
        bookId,
        source: "EBOOK",
        progressMode: "PERCENT",
        finishedAt: null,
        pausedAt: null,
        lastHeartbeatAt: session.lastHeartbeatAt,
        verifiedSeconds: session.verifiedSeconds,
        readerLeaseId: session.readerLeaseId,
      },
      data: {
        pausedAt: now,
        lastHeartbeatAt: now,
        verifiedSeconds,
      },
    });

    if (result.count === 1) {
      return db.readingSession.findUniqueOrThrow({
        where: { id: sessionId },
      });
    }
  }

  throw new Error("EPUB pause update conflict");
};

export const resumeTrackedEbookReadingSession = async (
  userId: string,
  bookId: string,
  sessionId: string,
  readerLeaseId?: string,
  db: DbClient = prisma,
) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const session = await getActiveUserReadingSession(userId, bookId, db);

    if (
      !session ||
      session.id !== sessionId ||
      session.source !== "EBOOK" ||
      session.progressMode !== "PERCENT" ||
      session.pausedAt === null ||
      session.lastHeartbeatAt === null ||
      session.verifiedSeconds === null ||
      session.readerLeaseId !== (readerLeaseId ?? null)
    ) {
      throw new Error("No paused EPUB session to resume");
    }

    const now = new Date();

    const pausedSeconds = getTotalPausedSeconds(
      session.pausedSeconds,
      session.pausedAt,
      now,
    );

    const result = await db.readingSession.updateMany({
      where: {
        id: sessionId,
        userId,
        bookId,
        source: "EBOOK",
        progressMode: "PERCENT",
        finishedAt: null,
        pausedAt: session.pausedAt,
        lastHeartbeatAt: session.lastHeartbeatAt,
        verifiedSeconds: session.verifiedSeconds,
        readerLeaseId: session.readerLeaseId,
      },
      data: {
        pausedAt: null,
        pausedSeconds,
        lastHeartbeatAt: now,
      },
    });

    if (result.count === 1) {
      return db.readingSession.findUniqueOrThrow({
        where: { id: sessionId },
      });
    }
  }

  throw new Error("EPUB resume update conflict");
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
  expectedReaderLeaseId?: string | null;
  expectedEbookHeartbeat?: {
    lastHeartbeatAt: Date;
    verifiedSeconds: number;
    pausedAt: Date | null;
  };
};

export const finishUserReadingSession = async (
  sessionId: string,
  data: FinishReadingSessionData,
  db: DbClient = prisma,
) => {
  const updated = await db.readingSession.updateMany({
    where: {
      id: sessionId,
      finishedAt: null,
      ...(data.expectedReaderLeaseId !== undefined && {
        readerLeaseId: data.expectedReaderLeaseId,
      }),
      ...(data.expectedEbookHeartbeat && {
        source: "EBOOK",
        progressMode: "PERCENT",
        lastHeartbeatAt: data.expectedEbookHeartbeat.lastHeartbeatAt,
        verifiedSeconds: data.expectedEbookHeartbeat.verifiedSeconds,
        pausedAt: data.expectedEbookHeartbeat.pausedAt,
      }),
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

  if (updated.count !== 1) {
    throw new Error("Reading session changed; retry finishing");
  }

  return db.readingSession.findUniqueOrThrow({
    where: { id: sessionId },
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
  startedAt?: Date;
  finishedAt?: Date;
  durationSeconds?: number;
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

      ...(data.startedAt !== undefined && {
        startedAt: data.startedAt,
      }),

      ...(data.finishedAt !== undefined && {
        finishedAt: data.finishedAt,
      }),

      ...(data.durationSeconds !== undefined && {
        durationSeconds: data.durationSeconds,
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
