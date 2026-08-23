import prisma from "../utils/prisma.js";

export const getAllBooks = async () => {
  return prisma.book.findMany();
};