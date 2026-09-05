import type { Book, LibraryBook, UserBook } from "@prisma/client";

import {
  getActiveReadingSessionsForBooks,
  getAccessibleLibraryBooksByBookIds,
  getLibraryBookOverridesByBookIds,
} from "../repositories/effectiveBooksRepository.js";

import { getLibraryMembership } from "../../libraries/repositories/librariesRepository.js";

import { buildEffectiveBook } from "../../../utils/effectiveBook.js";

type UserBookWithBook = UserBook & {
  book: Book;
};

type AccessibleLibraryBook = LibraryBook & {
  library: {
    id: string;
    name: string;
  };
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

  const activeLibraryBooks = libraryId
    ? await getLibraryBookOverridesByBookIds(libraryId, bookIds)
    : [];

  const accessibleLibraryBooks = await getAccessibleLibraryBooksByBookIds(
    userId,
    bookIds,
  );

  const activeLibraryBookMap = new Map(
    activeLibraryBooks.map((libraryBook) => [libraryBook.bookId, libraryBook]),
  );

  const accessibleLibraryBooksMap = new Map<string, AccessibleLibraryBook[]>();

  accessibleLibraryBooks.forEach((libraryBook) => {
    const existing = accessibleLibraryBooksMap.get(libraryBook.bookId) ?? [];

    existing.push(libraryBook);

    accessibleLibraryBooksMap.set(libraryBook.bookId, existing);
  });

  return userBooks.map((userBook) => {
    const activeLibraryBook = activeLibraryBookMap.get(userBook.bookId) ?? null;

    const accessibleBooks =
      accessibleLibraryBooksMap.get(userBook.bookId) ?? [];

    const fallbackLibraryBook =
      accessibleBooks.find(
        (libraryBook) =>
          libraryBook.libraryId !== libraryId && Boolean(libraryBook.coverUrl),
      ) ??
      accessibleBooks.find(
        (libraryBook) => libraryBook.libraryId !== libraryId,
      ) ??
      null;

    const effectiveBook = buildEffectiveBook({
      book: userBook.book,

      libraryBook: activeLibraryBook,

      userBook,
    });

    /*
     * Якщо книга є в активній бібліотеці —
     * вона належить поточному контексту.
     */
    if (activeLibraryBook) {
      return {
        ...effectiveBook,

        sourceLibrary: null,
      };
    }

    /*
     * Книги немає в активній бібліотеці.
     * Якщо вона є в іншій доступній бібліотеці —
     * використовуємо її обкладинку як fallback
     * і повідомляємо frontend, звідки книга.
     */
    if (fallbackLibraryBook) {
      return {
        ...effectiveBook,

        coverUrl: fallbackLibraryBook.coverUrl ?? effectiveBook.coverUrl,

        sourceLibrary: {
          id: fallbackLibraryBook.library.id,
          name: fallbackLibraryBook.library.name,
        },
      };
    }

    return {
      ...effectiveBook,

      sourceLibrary: null,
    };
  });
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


