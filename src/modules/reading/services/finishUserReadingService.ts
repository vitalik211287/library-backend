import { getBookById } from "../../books/repositories/booksRepository.js";

import { updateUserReadingProgress } from "../../user-books/repositories/userBooksRepository.js";

import {
  finishUserReadingSession,
  getActiveUserReadingSession,
} from "../repositories/userReadingRepository.js";

type FinishReadingData = {
  endPage?: number;
  endPercent?: number;
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

  /* =========================
     SESSION TIME
  ========================= */

  const totalElapsedSeconds = Math.max(
    Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
    0,
  );

  let totalPausedSeconds = session.pausedSeconds;

  if (session.pausedAt) {
    const currentPauseSeconds = Math.max(
      Math.floor((Date.now() - session.pausedAt.getTime()) / 1000),
      0,
    );

    totalPausedSeconds += currentPauseSeconds;
  }

  const durationSeconds = Math.max(totalElapsedSeconds - totalPausedSeconds, 0);

  /* =========================
     FINISH SESSION
  ========================= */

  const finishedSession = await finishUserReadingSession(session.id, {
    progressMode,

    ...(progressMode === "PAGES" &&
      endPage !== undefined && {
        endPage,
      }),

    ...(progressMode === "PERCENT" &&
      endPercent !== undefined && {
        endPercent,
      }),

    durationSeconds,

    pausedSeconds: totalPausedSeconds,
  });

  /* =========================
     BOOK STATUS
  ========================= */

  const isFinished =
    progressMode === "PAGES"
      ? book.pages !== null && endPage !== undefined && endPage >= book.pages
      : endPercent === 100;

  const status = isFinished ? "FINISHED" : "READING";

  /* =========================
     UPDATE USER BOOK
  ========================= */

  await updateUserReadingProgress(userId, bookId, {
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
  });

  return finishedSession;
};


