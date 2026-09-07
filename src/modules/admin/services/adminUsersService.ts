import {
  getAdminUserById,
  getAdminUsers,
  updateAdminUserBlockedStatus,
} from "../repositories/adminUsersRepository.js";

import { getEffectiveUserBooksService } from "../../user-books/services/effectiveUserBooksService.js";

export const getAdminUsersService = async () => {
  return getAdminUsers();
};

export const getAdminUserByIdService = async (userId: string) => {
  const user = await getAdminUserById(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const effectiveBooks = await getEffectiveUserBooksService(userId, user.books);

  const effectiveBookMap = new Map(
    effectiveBooks.map((book) => [book.id, book]),
  );

  return {
    ...user,

    books: user.books.map((userBook) => ({
      ...userBook,

      book: effectiveBookMap.get(userBook.bookId) ?? userBook.book,
    })),

    activityLogs: user.activityLogs.map((activityLog) => ({
      ...activityLog,

      book: activityLog.bookId
        ? (effectiveBookMap.get(activityLog.bookId) ?? activityLog.book)
        : activityLog.book,
    })),
  };
};

export const updateAdminUserBlockedStatusService = async (
  adminUserId: string,
  userId: string,
  isBlocked: boolean,
) => {
  if (adminUserId === userId && isBlocked) {
    throw new Error("CANNOT_BLOCK_SELF");
  }

  const user = await getAdminUserById(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return updateAdminUserBlockedStatus(userId, isBlocked);
};
