import prisma from "../utils/prisma.js";
import type { Prisma } from "@prisma/client";

export const addBook = async (data: Prisma.BookCreateInput) => {
  return prisma.book.create({
    data,
  });
};
