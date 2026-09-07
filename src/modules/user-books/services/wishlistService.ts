import { getBookById } from "../../books/repositories/booksRepository.js";

import { getWishlistUserBooks } from "../repositories/userBooksRepository.js";

import { getEffectiveUserBooksService } from "./effectiveUserBooksService.js";
import { updateUserBookService } from "./updateUserBookService.js";

export const getWishlistService = async (
  userId: string,
  libraryId?: string,
) => {
  const userBooks = await getWishlistUserBooks(userId);

  const books = await getEffectiveUserBooksService(
    userId,
    userBooks,
    libraryId,
  );

  return {
    count: books.length,
    books,
  };
};

export const addToWishlistService = async (userId: string, bookId: string) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("BOOK_NOT_FOUND");
  }

  return updateUserBookService(userId, bookId, { isWishlist: true });
};

export const removeFromWishlistService = async (
  userId: string,
  bookId: string,
) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("BOOK_NOT_FOUND");
  }

  return updateUserBookService(userId, bookId, { isWishlist: false });
};

