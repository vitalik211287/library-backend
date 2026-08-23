import prisma from "../utils/prisma.js";

export const updateBookCover = async (
  id: string,
  coverUrl: string
) => {
  return prisma.book.update({
    where: {
      id,
    },
    data: {
      coverUrl,
    },
  });
};