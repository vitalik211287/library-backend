import prisma from "../utils/prisma.js";

export const createLibraryForUser = async (
  userId: string,
  name = "Домашня бібліотека",
) => {
  return prisma.library.create({
    data: {
      name,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
    include: {
      members: true,
    },
  });
};
