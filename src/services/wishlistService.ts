import {
  getBookById,
  getWishlistUserBooks,
  addUserBookToWishlist,
  removeUserBookFromWishlist,
} from "../repositories/userReadingRepository.js";

export const getWishlistService = async (
  userId: string,
) => {
  const userBooks =
    await getWishlistUserBooks(userId);

  return {
    count: userBooks.length,

    books: userBooks.map(
      ({
        book,
        ...userBook
      }) => ({
        book,
        userBook,
      }),
    ),
  };
};

export const addToWishlistService = async (
  userId: string,
  bookId: string,
) => {
  const book =
    await getBookById(bookId);

  if (!book) {
    throw new Error("BOOK_NOT_FOUND");
  }

  return addUserBookToWishlist(
    userId,
    bookId,
  );
};

export const removeFromWishlistService = async (
  userId: string,
  bookId: string,
) => {
  const book =
    await getBookById(bookId);

  if (!book) {
    throw new Error("BOOK_NOT_FOUND");
  }

  return removeUserBookFromWishlist(
    userId,
    bookId,
  );
};