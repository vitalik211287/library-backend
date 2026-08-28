import { getFinishedUserBooks } from "../repositories/userReadingRepository.js";

export const getFinishedUserBooksService =
  async (userId: string) => {
    const userBooks =
      await getFinishedUserBooks(userId);

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