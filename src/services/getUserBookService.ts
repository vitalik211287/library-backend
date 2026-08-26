import { getOrCreateUserBook } from "../repositories/userBooksRepository.js";

export const getUserBookService = async (
  userId: string,
  bookId: string,
) => {
  const userBook = await getOrCreateUserBook(
    userId,
    bookId,
  );

  return userBook;
};