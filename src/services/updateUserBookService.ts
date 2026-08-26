import type {
  ReadingStatus,
} from "@prisma/client";

import { updateUserBook } from "../repositories/userBooksRepository.js";

type UpdateUserBookData = {
  currentPage?: number;
  status?: ReadingStatus;
  rating?: number | null;
};

export const updateUserBookService = async (
  userId: string,
  bookId: string,
  data: UpdateUserBookData,
) => {
  if (
    data.currentPage !== undefined &&
    (
      !Number.isInteger(data.currentPage) ||
      data.currentPage < 0
    )
  ) {
    throw new Error("Invalid current page");
  }

  if (
    data.rating !== undefined &&
    data.rating !== null &&
    (
      !Number.isInteger(data.rating) ||
      data.rating < 1 ||
      data.rating > 5
    )
  ) {
    throw new Error("Invalid rating");
  }

  return updateUserBook(
    userId,
    bookId,
    data,
  );
};