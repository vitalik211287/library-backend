import prisma from "../../../utils/prisma.js";

import { getBookById } from "../../books/repositories/booksRepository.js";

import { getUserBook } from "../../user-books/repositories/userBooksRepository.js";
import { updateUserBookService } from "../../user-books/services/updateUserBookService.js";

import {
  deleteUserReadingSession,
  getAllFinishedUserReadingSessions,
  getFinishedUserReadingSessions,
  getLatestFinishedUserReadingSession,
  getUserReadingSessionById,
  updateUserReadingSessionProgress,
} from "../repositories/userReadingRepository.js";

type UpdateReadingSessionData = {
  endPage?: number;
  endPercent?: number;
};

export const getAllUserReadingSessionsService = async (userId: string) => {
  return getAllFinishedUserReadingSessions(userId);
};

export const getUserReadingSessionsService = async (
  userId: string,
  bookId: string,
) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const sessions = await getFinishedUserReadingSessions(userId, bookId);

  return sessions.slice().reverse();
};

export const updateUserReadingSessionService = async (
  userId: string,
  bookId: string,
  sessionId: string,
  data: UpdateReadingSessionData,
) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const session = await getUserReadingSessionById(userId, bookId, sessionId);

  if (!session) {
    throw new Error("Reading session not found");
  }

  const userBook = await getUserBook(userId, bookId);

  if (!userBook) {
    throw new Error("User book not found");
  }

  const latestSession = await getLatestFinishedUserReadingSession(
    userId,
    bookId,
  );

  const isLatestSession = latestSession?.id === session.id;

  const previousEndPage = session.endPage;

  const previousEndPercent = session.endPercent;

  if (session.progressMode === "PAGES") {
    if (data.endPage === undefined) {
      throw new Error("End page is required");
    }

    if (!Number.isInteger(data.endPage)) {
      throw new Error("End page must be an integer");
    }

    if (data.endPage < session.startPage) {
      throw new Error("End page cannot be less than start page");
    }

    if (book.pages !== null && data.endPage > book.pages) {
      throw new Error("End page cannot be greater than total book pages");
    }

    const endPage = data.endPage;

    const updatedSession = await prisma.$transaction(async (tx) => {
      const updatedSession = await updateUserReadingSessionProgress(
        session.id,
        {
          endPage,
        },
        tx,
      );

    const userBookPointsToSession =
      previousEndPage !== null &&
      userBook.progressMode === "PAGES" &&
      userBook.currentPage === previousEndPage;

    if (isLatestSession && userBookPointsToSession) {
      await updateUserBookService(
        userId,
        bookId,
        {
          progressMode: "PAGES",
          currentPage: endPage,
        },
        tx,
      );
    }

      return updatedSession;
    });

    return updatedSession;
  }

  if (data.endPercent === undefined) {
    throw new Error("End percent is required");
  }

  if (!Number.isFinite(data.endPercent)) {
    throw new Error("End percent must be a number");
  }

  if (data.endPercent < 0 || data.endPercent > 100) {
    throw new Error("End percent must be between 0 and 100");
  }

  const startPercent = session.startPercent ?? 0;

  if (data.endPercent < startPercent) {
    throw new Error("End percent cannot be less than start percent");
  }

  const endPercent = data.endPercent;

  const updatedSession = await prisma.$transaction(async (tx) => {
    const updatedSession = await updateUserReadingSessionProgress(
      session.id,
      {
        endPercent,
      },
      tx,
    );

    const userBookPointsToSession =
      previousEndPercent !== null &&
      userBook.progressMode === "PERCENT" &&
      userBook.currentPercent === previousEndPercent;

    if (isLatestSession && userBookPointsToSession) {
      await updateUserBookService(
        userId,
        bookId,
        {
          progressMode: "PERCENT",
          currentPercent: endPercent,
        },
        tx,
      );
    }

    return updatedSession;
  });

  return updatedSession;
};

export const deleteUserReadingSessionService = async (
  userId: string,
  bookId: string,
  sessionId: string,
) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const session = await getUserReadingSessionById(userId, bookId, sessionId);

  if (!session) {
    throw new Error("Reading session not found");
  }

  const userBook = await getUserBook(userId, bookId);

  if (!userBook) {
    throw new Error("User book not found");
  }

  const latestBeforeDelete = await getLatestFinishedUserReadingSession(
    userId,
    bookId,
  );

  const wasLatestSession = latestBeforeDelete?.id === session.id;

  const userBookPointsToDeletedSession =
    session.progressMode === "PAGES"
      ? session.endPage !== null &&
        userBook.progressMode === "PAGES" &&
        userBook.currentPage === session.endPage
      : session.endPercent !== null &&
        userBook.progressMode === "PERCENT" &&
        userBook.currentPercent === session.endPercent;

  await prisma.$transaction(async (tx) => {
    await deleteUserReadingSession(session.id, tx);

    if (wasLatestSession && userBookPointsToDeletedSession) {
      const latestAfterDelete = await getLatestFinishedUserReadingSession(
        userId,
        bookId,
        tx,
      );

      if (latestAfterDelete) {
        if (latestAfterDelete.progressMode === "PAGES") {
          await updateUserBookService(
            userId,
            bookId,
            {
              progressMode: "PAGES",
              currentPage:
                latestAfterDelete.endPage ?? latestAfterDelete.startPage,
            },
            tx,
          );
        } else {
          await updateUserBookService(
            userId,
            bookId,
            {
              progressMode: "PERCENT",
              currentPercent:
                latestAfterDelete.endPercent ??
                latestAfterDelete.startPercent ??
                0,
            },
            tx,
          );
        }
      } else {
        if (session.progressMode === "PAGES") {
          await updateUserBookService(
            userId,
            bookId,
            {
              progressMode: "PAGES",
              currentPage: session.startPage,
            },
            tx,
          );
        } else {
          await updateUserBookService(
            userId,
            bookId,
            {
              progressMode: "PERCENT",
              currentPercent: session.startPercent ?? 0,
            },
            tx,
          );
        }
      }
    }
  });

  return {
    success: true,
    deletedSessionId: session.id,
  };
};
