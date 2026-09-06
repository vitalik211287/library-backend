import prisma from "../../../utils/prisma.js";

export const getAdminUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      isBlocked: true,
      createdAt: true,
      updatedAt: true,

      _count: {
        select: {
          books: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getAdminUserById = async (userId: string) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      isBlocked: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const updateAdminUserBlockedStatus = async (
  userId: string,
  isBlocked: boolean,
) => {
  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      isBlocked,
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBlocked: true,
    },
  });
};
