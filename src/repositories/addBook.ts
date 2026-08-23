import prisma from "../utils/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export const addBook = async (data: Prisma.BookCreateInput) => {
  return prisma.book.create({
    data,
  });
};
