import prisma from "../../../utils/prisma.js";
import { getBookById } from "../../books/repositories/booksRepository.js";
import { updateUserBookService } from "../../user-books/services/updateUserBookService.js";
import type { PostCommitEffect } from "../../user-books/services/updateUserBookService.js";

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
  if (!book) throw new Error("Book not found");

  const startedAt = new Date(data.startedAt);
  const finishedAt = new Date(data.finishedAt);
  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(finishedAt.getTime())) {
    throw new Error("Invalid session date");
  }
  if (finishedAt <= startedAt) {
    throw new Error("Finished time must be after started time");
  }
  if (finishedAt.getTime() > Date.now()) {
    throw new Error("A reading session cannot end in the future");
  }
  if (!Number.isInteger(data.startPage) || !Number.isInteger(data.endPage)) {
    throw new Error("Invalid page number");
  }
  if (data.startPage < 0 || data.endPage < data.startPage) {
    throw new Error("Invalid page range");
  }
  if (book.pages !== null && data.endPage > book.pages) {
    throw new Error("End page exceeds total book pages");
  }
  if (!Number.isInteger(data.durationSeconds) || data.durationSeconds <= 0) {
    throw new Error("Duration must be a positive integer");
  }
  if (data.durationSeconds * 1000 > finishedAt.getTime() - startedAt.getTime()) {
    throw new Error("Reading duration exceeds session time span");
  }

  const postCommitEffects: PostCommitEffect[] = [];

  const session = await prisma.$transaction(async (tx) => {
    // Manual imports are only allowed for a book already in the user's catalog.
    // Never silently create a UserBook with zero progress.
    const userBook = await tx.userBook.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    if (!userBook || userBook.isWishlist) {
      throw new Error("Add the book to your reading catalog first");
    }

    // Compare with active and finished sessions of the SAME BOOK.
    // This also catches an exact retry of the POST request.
    const overlap = await tx.readingSession.findFirst({
      where: {
        userId,
        bookId,
        startedAt: { lt: finishedAt },
        OR: [
          { finishedAt: null },
          { finishedAt: { gt: startedAt } },
        ],
      },
      select: { id: true },
    });
    if (overlap) throw new Error("A reading session already overlaps this time interval");

    const session = await tx.readingSession.create({
      data: {
        userId,
        bookId,
        source: "MANUAL",
        progressMode: "PAGES",
        startedAt,
        finishedAt,
        startPage: data.startPage,
        endPage: data.endPage,
        durationSeconds: data.durationSeconds,
        pausedSeconds: 0,
      },
    });

    // Backdated imports must never roll back the progress of a newer session.
    // Advance only when this is the latest finished session for this book,
    // the stored progress has not moved beyond this session's starting point,
    // and there is no live timer to interfere with.
    const newer = await tx.readingSession.findFirst({
      where: {
        userId,
        bookId,
        id: { not: session.id },
        OR: [
          { finishedAt: null },
          { finishedAt: { gt: finishedAt } },
        ],
      },
      select: { id: true },
    });
    if (
      !newer &&
      userBook.progressMode === "PAGES" &&
      userBook.currentPage <= data.startPage &&
      userBook.status !== "FINISHED"
    ) {
      const isFinished = book.pages !== null && data.endPage === book.pages;
      await updateUserBookService(
        userId,
        bookId,
        {
          progressMode: "PAGES",
          currentPage: data.endPage,
          status: isFinished ? "FINISHED" : "READING",
        },
        tx,
        postCommitEffects,
      );
    }

    return session;
  });

  for (const effect of postCommitEffects) {
    try {
      await effect();
    } catch (error) {
      console.warn("Reading notifications failed after commit", error);
    }
  }

  return session;
};


