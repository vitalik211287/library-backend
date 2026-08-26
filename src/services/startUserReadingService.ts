import {
  createUserReadingSession,
  getActiveUserReadingSession,
  getBookById,
  getOrCreateUserBook,
  updateUserReadingProgress,
} from "../repositories/userReadingRepository.js";

export const startUserReadingService = async (
  userId: string,
  bookId: string,
) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const userBook = await getOrCreateUserBook(
    userId,
    bookId,
  );

  const activeSession =
    await getActiveUserReadingSession(
      userId,
      bookId,
    );

  if (activeSession) {
    throw new Error(
      "Reading session is already active",
    );
  }

  const session =
    await createUserReadingSession(
      userId,
      bookId,
      userBook.currentPage,
    );

  await updateUserReadingProgress(
    userId,
    bookId,
    userBook.currentPage,
    "READING",
  );

  return session;
};