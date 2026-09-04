import type { ProgressMode } from "@prisma/client";
import { getBookById } from "../repositories/booksRepository.js";

import {
  getOrCreateUserBook,
  updateUserReadingProgress,
} from "../repositories/userBooksRepository.js";

import {
  createUserReadingSession,
  getActiveUserReadingSession,
} from "../repositories/userReadingRepository.js";

type StartReadingData = {
  progressMode?: ProgressMode;
  startPage?: number;
  startPercent?: number;
};

export const startUserReadingService = async (
  userId: string,
  bookId: string,
  data: StartReadingData = {},
) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const userBook = await getOrCreateUserBook(userId, bookId);

  const activeSession = await getActiveUserReadingSession(userId, bookId);

  if (activeSession) {
    throw new Error("Reading session is already active");
  }

  const progressMode = data.progressMode ?? userBook.progressMode ?? "PAGES";

  let startPage = userBook.currentPage;
  let startPercent = userBook.currentPercent;

  if (progressMode === "PAGES") {
    if (data.startPage !== undefined) {
      if (!Number.isInteger(data.startPage) || data.startPage < 0) {
        throw new Error("Invalid start page");
      }

      if (book.pages !== null && data.startPage > book.pages) {
        throw new Error(`Book has only ${book.pages} pages`);
      }

      startPage = data.startPage;
    }
  }

  if (progressMode === "PERCENT") {
    if (data.startPercent !== undefined) {
      if (
        !Number.isInteger(data.startPercent) ||
        data.startPercent < 0 ||
        data.startPercent > 100
      ) {
        throw new Error("Percent must be between 0 and 100");
      }

      startPercent = data.startPercent;
    }
  }

  const session = await createUserReadingSession(userId, bookId, {
    progressMode,
    startPage,
    startPercent,
  });

  await updateUserReadingProgress(userId, bookId, {
    progressMode,

    ...(progressMode === "PAGES" && {
      currentPage: startPage,
    }),

    ...(progressMode === "PERCENT" && {
      currentPercent: startPercent,
    }),

    status: "READING",
  });

  return session;
};
