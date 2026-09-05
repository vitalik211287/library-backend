import { getBookById } from "../../books/repositories/booksRepository.js";

import {
  addUserBookToWishlist,
  getWishlistUserBooks,
  removeUserBookFromWishlist,
} from "../repositories/userBooksRepository.js";

import { getEffectiveUserBooksService } from "./effectiveUserBooksService.js";

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

  return addUserBookToWishlist(userId, bookId);
};

export const removeFromWishlistService = async (
  userId: string,
  bookId: string,
) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("BOOK_NOT_FOUND");
  }

  return removeUserBookFromWishlist(userId, bookId);
};

