import prisma from "../utils/prisma.js";

export const getAllBooks = async () => {
  return prisma.book.findMany();
};

export const getBookById = async (bookId: string) => {
  return prisma.book.findUnique({
    where: {
      id: bookId,
    },
  });
};

export const getBookByIsbn = async (isbn: string) => {
  return prisma.book.findUnique({
    where: {
      isbn,
    },
  });
};
