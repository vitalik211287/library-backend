import { getFinishedUserBooks } from "../repositories/userReadingRepository.js";

export const getFinishedUserBooksService =
  async (
    userId: string,
    page: number,
    limit: number,
  ) => {
    const {
      userBooks,
      total,
    } = await getFinishedUserBooks(
      userId,
      page,
      limit,
    );

    const totalPages =
      Math.ceil(total / limit);

    return {
      count: userBooks.length,
      total,
      page,
      limit,
      totalPages,

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