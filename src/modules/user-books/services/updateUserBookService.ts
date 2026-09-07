import type { ProgressMode, ReadingStatus } from "@prisma/client";

import prisma from "../../../utils/prisma.js";

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
  isWishlist?: boolean;
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

  if (data.status !== undefined) {
    updateData.isWishlist = false;
  }

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

  const updatedUserBook = await updateUserBook(userId, bookId, updateData);

  const activities = [];

  if (data.status !== undefined && data.status !== userBook?.status) {
    activities.push({
      userId,
      bookId,
      type: "STATUS_CHANGED" as const,
      oldValue: userBook?.status ?? null,
      newValue: data.status,
    });
  }

  const oldProgress =
    progressMode === "PERCENT"
      ? (userBook?.currentPercent ?? 0)
      : (userBook?.currentPage ?? 0);

  const newProgress =
    progressMode === "PERCENT"
      ? (updateData.currentPercent ?? oldProgress)
      : (updateData.currentPage ?? oldProgress);

  if (oldProgress !== newProgress) {
    activities.push({
      userId,
      bookId,
      type:
        newProgress === 0 && oldProgress > 0
          ? ("PROGRESS_RESET" as const)
          : ("PROGRESS_CHANGED" as const),
      oldValue: String(oldProgress),
      newValue: String(newProgress),
    });
  }

  if (data.rating !== undefined && data.rating !== userBook?.rating) {
    activities.push({
      userId,
      bookId,
      type: "RATING_CHANGED" as const,
      oldValue:
        userBook?.rating === null || userBook?.rating === undefined
          ? null
          : String(userBook.rating),
      newValue: data.rating === null ? null : String(data.rating),
    });
  }

  const oldWishlist = userBook?.isWishlist ?? false;
  const newWishlist = updateData.isWishlist ?? oldWishlist;

  if (oldWishlist !== newWishlist) {
    activities.push({
      userId,
      bookId,
      type: "WISHLIST_CHANGED" as const,
      oldValue: String(oldWishlist),
      newValue: String(newWishlist),
    });
  }

  if (activities.length > 0) {
    await prisma.activityLog.createMany({
      data: activities,
    });
  }

  return updatedUserBook;
};
