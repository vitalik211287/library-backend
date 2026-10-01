import prisma from "../../../utils/prisma.js";

export const getAllBooks = async (query?: string) => {
  const normalizedQuery = query?.trim();

  if (!normalizedQuery) {
    return prisma.book.findMany();
  }

  return prisma.book.findMany({
    where: {
      OR: [
        {
          title: {
            contains: normalizedQuery,
            mode: "insensitive",
          },
        },
        {
          author: {
            contains: normalizedQuery,
            mode: "insensitive",
          },
        },
      ],
    },
    take: 10,
  });
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
