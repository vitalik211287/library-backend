import { getBookById } from "../repositories/booksRepository.js";

import { getOrCreateUserBook } from "../repositories/userBooksRepository.js";

import { createImportedReadingSession } from "../repositories/userReadingRepository.js";

type ImportReadingData = {
  startedAt: string;
  finishedAt: string;
  startPage: number;
  endPage: number;
  durationSeconds: number;
};

export const importUserReadingService = async (
  userId: string,
  bookId: string,
  data: ImportReadingData,
) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  await getOrCreateUserBook(userId, bookId);

  const startedAt = new Date(data.startedAt);

  const finishedAt = new Date(data.finishedAt);

  /* =========================
       DATE VALIDATION
    ========================= */

  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(finishedAt.getTime())) {
    throw new Error("Invalid session date");
  }

  if (finishedAt <= startedAt) {
    throw new Error("Finished time must be after started time");
  }

  /* =========================
       PAGE VALIDATION
    ========================= */

  if (!Number.isInteger(data.startPage) || !Number.isInteger(data.endPage)) {
    throw new Error("Invalid page number");
  }

  if (data.startPage < 0) {
    throw new Error("Start page cannot be negative");
  }

  if (data.endPage < data.startPage) {
    throw new Error("End page cannot be less than start page");
  }

  if (book.pages !== null && data.endPage > book.pages) {
    throw new Error("End page exceeds total book pages");
  }

  /* =========================
       DURATION VALIDATION
    ========================= */

  if (!Number.isInteger(data.durationSeconds) || data.durationSeconds < 0) {
    throw new Error("Invalid duration");
  }

  /* =========================
       CREATE SESSION
    ========================= */

  const session = await createImportedReadingSession(
    userId,
    bookId,
    startedAt,
    finishedAt,
    data.startPage,
    data.endPage,
    data.durationSeconds,
  );

  return session;
};
