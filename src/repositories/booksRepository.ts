import prisma from "../utils/prisma.js";
import type { Prisma } from "@prisma/client";

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

export const createBook = async (data: Prisma.BookCreateInput) => {
  return prisma.book.create({
    data,
  });
};

export const updateBook = async (id: string, data: Prisma.BookUpdateInput) => {
  return prisma.book.update({
    where: {
      id,
    },
    data,
  });
};

export const updateBookCover = async (id: string, coverUrl: string) => {
  return prisma.book.update({
    where: {
      id,
    },
    data: {
      coverUrl,
    },
  });
};
