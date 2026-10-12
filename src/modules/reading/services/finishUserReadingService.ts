import prisma from "../../../utils/prisma.js";
import { getBookById } from "../../books/repositories/booksRepository.js";

import { updateUserBookService } from "../../user-books/services/updateUserBookService.js";
import type { PostCommitEffect } from "../../user-books/services/updateUserBookService.js";

import {
  finishUserReadingSession,
  getActiveUserReadingSession,
} from "../repositories/userReadingRepository.js";

import { calculateReadingSessionTime } from "../utils/readingSessionTime.js";
import { calculateVerifiedEbookSeconds } from "../utils/ebookHeartbeatTime.js";

type FinishReadingData = {
  endPage?: number;
  endPercent?: number;
  epubStartPositionPercent?: number;
  epubEndPositionPercent?: number;
  epubReachedEnd?: boolean;
  readerLeaseId?: string;
};

export const finishUserReadingService = async (
  userId: string,
  bookId: string,
  data: FinishReadingData,
) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const session = await getActiveUserReadingSession(userId, bookId);

  if (!session) {
    throw new Error("No active reading session");
  }

  if (
    session.source === "EBOOK" &&
    session.readerLeaseId !== null &&
    session.readerLeaseId !== data.readerLeaseId
  ) {
    throw new Error("EPUB reader ownership has changed");
  }

  const progressMode = session.progressMode;

  let endPage: number | undefined;
  let endPercent: number | undefined;

  /* =========================
     PAGES
  ========================= */

  if (progressMode === "PAGES") {
    if (data.endPage === undefined || !Number.isInteger(data.endPage)) {
      throw new Error("End page is required");
    }

    endPage = data.endPage;

    if (endPage < session.startPage) {
      throw new Error("End page cannot be less than start page");
    }

    if (book.pages !== null && endPage > book.pages) {
      throw new Error(`Book has only ${book.pages} pages`);
    }
  }

  /* =========================
     PERCENT
  ========================= */

  if (progressMode === "PERCENT") {
    if (data.endPercent === undefined || !Number.isInteger(data.endPercent)) {
      throw new Error("End percent is required");
    }

    endPercent = data.endPercent;

    if (endPercent < 0 || endPercent > 100) {
      throw new Error("Percent must be between 0 and 100");
    }

    const startPercent = session.startPercent ?? 0;

    if (endPercent < startPercent) {
      throw new Error("End percent cannot be less than start percent");
    }
  }

  // EPUB positions may move backwards when the reader seeks or rereads.
  // Do not confuse them with the cumulative progress percentage.
  const epubPositions = [data.epubStartPositionPercent, data.epubEndPositionPercent];
  if (epubPositions.some((value) => value !== undefined)) {
    if (session.source !== "EBOOK" || progressMode !== "PERCENT") {
      throw new Error("EPUB positions are only allowed for EPUB sessions");
    }
    if (epubPositions.some((value) =>
      value !== undefined && (!Number.isInteger(value) || value < 0 || value > 100)
    )) {
      throw new Error("EPUB positions must be integer percentages between 0 and 100");
    }
  }

  if (
    data.epubReachedEnd !== undefined &&
    (typeof data.epubReachedEnd !== "boolean" ||
      session.source !== "EBOOK" ||
      progressMode !== "PERCENT")
  ) {
    throw new Error("Invalid EPUB completion flag");
  }

  /* =========================
     SESSION TIME
  ========================= */

  const now = new Date();

  const legacyTime = calculateReadingSessionTime(
    session.startedAt,
    session.pausedAt,
    session.pausedSeconds,
    now,
  );

  const verifiedTime = session.source === "EBOOK"
    ? calculateVerifiedEbookSeconds({
        verifiedSeconds: session.verifiedSeconds,
        lastHeartbeatAt: session.lastHeartbeatAt,
        pausedAt: session.pausedAt,
        now,
      })
    : null;

  const durationSeconds = verifiedTime ?? legacyTime.durationSeconds;
  const totalPausedSeconds = legacyTime.pausedSeconds;

  /* =========================
     FINISH SESSION
  ========================= */

  const postCommitEffects: PostCommitEffect[] = [];

  const finishedSession = await prisma.$transaction(async (tx) => {
    const savedSession = await finishUserReadingSession(session.id, {
      progressMode,

      ...(progressMode === "PAGES" &&
        endPage !== undefined && {
          endPage,
        }),

      ...(progressMode === "PERCENT" &&
        endPercent !== undefined && {
          endPercent,
        }),

      ...(session.source === "EBOOK" && data.epubStartPositionPercent !== undefined && {
        epubStartPositionPercent: data.epubStartPositionPercent,
      }),
      ...(session.source === "EBOOK" && data.epubEndPositionPercent !== undefined && {
        epubEndPositionPercent: data.epubEndPositionPercent,
      }),

      durationSeconds,

      pausedSeconds: totalPausedSeconds,

      ...(session.source === "EBOOK" && {
        expectedReaderLeaseId: session.readerLeaseId,
      }),

      ...(verifiedTime !== null &&
        session.source === "EBOOK" &&
        session.lastHeartbeatAt !== null &&
        session.verifiedSeconds !== null && {
          expectedEbookHeartbeat: {
            lastHeartbeatAt: session.lastHeartbeatAt,
            verifiedSeconds: session.verifiedSeconds,
            pausedAt: session.pausedAt,
          },
        }),
    }, tx);

    /* =========================
       BOOK STATUS
    ========================= */

    const isFinished =
      session.source === "EBOOK"
        ? data.epubReachedEnd === true
        : progressMode === "PAGES"
          ? book.pages !== null && endPage !== undefined && endPage >= book.pages
          : endPercent === 100;

    const status = isFinished ? "FINISHED" : "READING";

    /* =========================
       UPDATE USER BOOK
    ========================= */

    await updateUserBookService(userId, bookId, {
      progressMode,

      ...(progressMode === "PAGES" &&
        endPage !== undefined && {
          currentPage: endPage,
        }),

      ...(progressMode === "PERCENT" &&
        endPercent !== undefined && {
          currentPercent: endPercent,
        }),

      status,
    }, tx, postCommitEffects);

    return savedSession;
  });

  // Notifications run only after the transaction has committed.
  for (const effect of postCommitEffects) {
    try {
      await effect();
    } catch (error) {
      console.warn("Reading notifications failed after commit", error);
    }
  }

  return finishedSession;
};


