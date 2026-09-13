import prisma from "../../../utils/prisma.js";

export const getSocialFeed = async (
  currentUserId: string,
  limit = 30,
) => {
  return prisma.socialActivity.findMany({
    where: {
      OR: [
        {
          userId: currentUserId,
        },
        {
          user: {
            followers: {
              some: {
                followerId: currentUserId,
              },
            },
          },
        },
      ],
    },

    select: {
      id: true,
      type: true,
      achievementId: true,
      bookId: true,
      createdAt: true,

      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },

      book: {
        select: {
          id: true,
          title: true,
          author: true,
          coverUrl: true,
          pages: true,
        },
      },

      kudos: {
        where: {
          userId: currentUserId,
        },
        select: {
          id: true,
        },
      },

      _count: {
        select: {
          kudos: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: limit,
  });
};