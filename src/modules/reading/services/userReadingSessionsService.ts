import prisma from "../../../utils/prisma.js";
import { validateReadingSessionEdit } from "../utils/validateReadingSessionEdit.js";

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
  startedAt?: string;
  durationSeconds?: number;
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

  const isTimeEdit =
    data.startedAt !== undefined ||
    data.durationSeconds !== undefined;

  if (isTimeEdit) {
    if (
      session.source !== "MANUAL" ||
      session.pausedSeconds !== 0 ||
      session.finishedAt === null
    ) {
      throw new Error("Time editing is not supported for this session");
    }
  }
  const editedTime = isTimeEdit
    ? validateReadingSessionEdit(
        session.startedAt,
        session.durationSeconds,
        data,
      )
    : null;
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

  let sessionProgress: {
    endPage?: number;
    endPercent?: number;
  };

  let bookProgress:
    | { progressMode: "PAGES"; currentPage: number }
    | { progressMode: "PERCENT"; currentPercent: number };

  if (session.progressMode === "PAGES") {
    const endPage = data.endPage ?? (isTimeEdit ? session.endPage : undefined);

    if (endPage === undefined || endPage === null) {
      throw new Error("End page is required");
    }

    if (!Number.isInteger(endPage)) {
      throw new Error("End page must be an integer");
    }

    if (endPage < session.startPage) {
      throw new Error("End page cannot be less than start page");
    }

    if (book.pages !== null && endPage > book.pages) {
      throw new Error("End page cannot be greater than total book pages");
    }

    sessionProgress = { endPage };
    bookProgress = {
      progressMode: "PAGES",
      currentPage: endPage,
    };
  } else {
    const endPercent =
      data.endPercent ?? (isTimeEdit ? session.endPercent : undefined);

    if (endPercent === undefined || endPercent === null) {
      throw new Error("End percent is required");
    }

    if (!Number.isFinite(endPercent)) {
      throw new Error("End percent must be a number");
    }

    if (endPercent < 0 || endPercent > 100) {
      throw new Error("End percent must be between 0 and 100");
    }

    const startPercent = session.startPercent ?? 0;

    if (endPercent < startPercent) {
      throw new Error("End percent cannot be less than start percent");
    }

    sessionProgress = { endPercent };
    bookProgress = {
      progressMode: "PERCENT",
      currentPercent: endPercent,
    };
  }

  const userBookPointsToSession =
    session.progressMode === "PAGES"
      ? previousEndPage !== null &&
        userBook.progressMode === "PAGES" &&
        userBook.currentPage === previousEndPage
      : previousEndPercent !== null &&
        userBook.progressMode === "PERCENT" &&
        userBook.currentPercent === previousEndPercent;

  return prisma.$transaction(async (tx) => {
    if (editedTime) {
      const overlappingSession = await tx.readingSession.findFirst({
        where: {
          userId,
          bookId,
          id: { not: sessionId },
          startedAt: { lt: editedTime.finishedAt },
          OR: [
            { finishedAt: null },
            { finishedAt: { gt: editedTime.startedAt } },
          ],
        },
        select: { id: true },
      });

      if (overlappingSession) {
        throw new Error("Reading session overlaps another session");
      }
    }

    const updatedSession = await updateUserReadingSessionProgress(
      session.id,
      {
        ...sessionProgress,
        ...(editedTime ?? {}),
      },
      tx,
    );

    const latestSessionAfterEdit = editedTime
      ? await getLatestFinishedUserReadingSession(userId, bookId, tx)
      : null;

    const isLatestAfterEdit = editedTime
      ? latestSessionAfterEdit?.id === session.id
      : isLatestSession;

    if (
      (data.endPage !== undefined || data.endPercent !== undefined) &&
      isLatestSession &&
      isLatestAfterEdit &&
      userBookPointsToSession
    ) {
      await updateUserBookService(
        userId,
        bookId,
        bookProgress,
        tx,
      );
    }

    return updatedSession;
  });
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
