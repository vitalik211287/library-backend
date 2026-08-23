import prisma from "../utils/prisma.js";

export const getAllBooks = async () => {
  return prisma.book.findMany();
};

export const getBookByIsbn = async (isbn: string) => {
  return prisma.book.findUnique({
    where: {
      isbn,
    },
  });
};