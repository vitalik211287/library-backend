import prisma from "../utils/prisma.js";

export const getUserBook = async (
  userId: string,
  bookId: string,
) => {
  return prisma.userBook.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
    include: {
      book: true,
    },
  });
};

export const createUserBook = async (
  userId: string,
  bookId: string,
) => {
  return prisma.userBook.create({
    data: {
      userId,
      bookId,
    },
    include: {
      book: true,
    },
  });
};

export const getOrCreateUserBook = async (
  userId: string,
  bookId: string,
) => {
  const existingUserBook = await getUserBook(
    userId,
    bookId,
  );

  if (existingUserBook) {
    return existingUserBook;
  }

  return createUserBook(userId, bookId);
};