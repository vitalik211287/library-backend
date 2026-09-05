import type { ProgressMode, ReadingStatus } from "@prisma/client";

import {
  getUserBook,
  updateUserBook,
} from "../repositories/userBooksRepository.js";

type UpdateUserBookData = {
  progressMode?: ProgressMode;
  currentPage?: number;
  currentPercent?: number;
  status?: ReadingStatus;
  rating?: number | null;
};

export const updateUserBookService = async (
  userId: string,
  bookId: string,
  data: UpdateUserBookData,
) => {
  const userBook = await getUserBook(userId, bookId);

  if (
    data.currentPage !== undefined &&
    (!Number.isInteger(data.currentPage) || data.currentPage < 0)
  ) {
    throw new Error("Invalid current page");
  }

  if (
    data.currentPercent !== undefined &&
    (!Number.isInteger(data.currentPercent) ||
      data.currentPercent < 0 ||
      data.currentPercent > 100)
  ) {
    throw new Error("Percent must be between 0 and 100");
  }

  if (
    data.rating !== undefined &&
    data.rating !== null &&
    (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5)
  ) {
    throw new Error("Invalid rating");
  }

  if (
    data.currentPage !== undefined &&
    userBook?.book.pages !== null &&
    userBook?.book.pages !== undefined &&
    data.currentPage > userBook.book.pages
  ) {
    throw new Error(`Book has only ${userBook.book.pages} pages`);
  }

  const progressMode = data.progressMode ?? userBook?.progressMode ?? "PAGES";

  const updateData: UpdateUserBookData = {
    ...data,
    progressMode,
  };

  if (data.status === "FINISHED") {
    if (progressMode === "PERCENT") {
      updateData.currentPercent = 100;
    }

    if (
      progressMode === "PAGES" &&
      userBook?.book.pages !== null &&
      userBook?.book.pages !== undefined
    ) {
      updateData.currentPage = userBook.book.pages;
    }
  }

  if (data.status === "NOT_STARTED") {
    if (progressMode === "PAGES") {
      updateData.currentPage = 0;
    }

    if (progressMode === "PERCENT") {
      updateData.currentPercent = 0;
    }
  }

  return updateUserBook(userId, bookId, updateData);
};

