import prisma from "../utils/prisma.js";
import type { Prisma } from "@prisma/client";

export const updateBook = async (
  id: string,
  data: Prisma.BookUpdateInput,
) => {
  return prisma.book.update({
    where: {
      id,
    },
    data,
  });
};