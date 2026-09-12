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

      books: {
        include: {
          book: true,
        },

        orderBy: {
          updatedAt: "desc",
        },
      },

      activityLogs: {
        select: {
          id: true,
          bookId: true,
          type: true,
          oldValue: true,
          newValue: true,
          createdAt: true,
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },

      libraryBookEvents: {
        select: {
          id: true,
          libraryId: true,
          bookId: true,
          actorUserId: true,
          type: true,
          occurredAt: true,
          library: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
      },
      readingSessions: {
        select: {
          id: true,
          bookId: true,
          progressMode: true,
          startedAt: true,
          finishedAt: true,
          startPage: true,
          endPage: true,
          startPercent: true,
          endPercent: true,
          durationSeconds: true,
          pausedAt: true,
          pausedSeconds: true,
          createdAt: true,
        },
        orderBy: {
          startedAt: "desc",
        },
      },
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
