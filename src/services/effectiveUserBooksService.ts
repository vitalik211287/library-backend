import type { Book, UserBook } from "@prisma/client";

import {
  getActiveReadingSessionsForBooks,
  getLibraryBookOverridesByBookIds,
} from "../repositories/effectiveBooksRepository.js";

import { getLibraryMembership } from "../repositories/librariesRepository.js";

import { buildEffectiveBook } from "../utils/effectiveBook.js";

type UserBookWithBook = UserBook & {
  book: Book;
};

export const getEffectiveUserBooksService = async (
  userId: string,
  userBooks: UserBookWithBook[],
  libraryId?: string,
) => {
  if (userBooks.length === 0) {
    return [];
  }

  if (libraryId) {
    const membership = await getLibraryMembership(libraryId, userId);

    if (!membership) {
      throw new Error("Library not found");
    }
  }

  const bookIds = userBooks.map((userBook) => userBook.bookId);

  const libraryBooks = libraryId
    ? await getLibraryBookOverridesByBookIds(libraryId, bookIds)
    : [];

  const libraryBookMap = new Map(
    libraryBooks.map((libraryBook) => [libraryBook.bookId, libraryBook]),
  );

  return userBooks.map((userBook) =>
    buildEffectiveBook({
      book: userBook.book,

      libraryBook: libraryBookMap.get(userBook.bookId) ?? null,

      userBook,
    }),
  );
};

export const getActiveReadingDataForBooks = async (
  userId: string,
  bookIds: string[],
) => {
  const sessions = await getActiveReadingSessionsForBooks(userId, bookIds);

  const sessionMap = new Map();

  /*
   * Запит відсортований newest first.
   * Якщо через старі дані існує >1 active
   * session для книги — беремо останню.
   */
  sessions.forEach((session) => {
    if (!sessionMap.has(session.bookId)) {
      sessionMap.set(session.bookId, session);
    }
  });

  return sessionMap;
};

export const getElapsedSeconds = (
  session:
    | {
        startedAt: Date;
        pausedAt: Date | null;
        pausedSeconds: number;
      }
    | null
    | undefined,
) => {
  if (!session) {
    return 0;
  }

  const now = Date.now();

  const totalElapsedSeconds = Math.max(
    Math.floor((now - session.startedAt.getTime()) / 1000),
    0,
  );

  let totalPausedSeconds = session.pausedSeconds;

  if (session.pausedAt) {
    totalPausedSeconds += Math.max(
      Math.floor((now - session.pausedAt.getTime()) / 1000),
      0,
    );
  }

  return Math.max(totalElapsedSeconds - totalPausedSeconds, 0);
};
