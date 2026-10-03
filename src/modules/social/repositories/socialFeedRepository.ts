import { Prisma } from "@prisma/client";
import prisma from "../../../utils/prisma.js";

export const getSocialActivityById = async (activityId: string) => {
  return prisma.socialActivity.findUnique({
    where: {
      id: activityId,
    },
    select: {
      id: true,
    },
  });
};

export const getSocialFeed = async (
  currentUserId: string,
  limit = 30,
  scope = "all",
  profileUserId?: string,
) => {
  return prisma.socialActivity.findMany({
    where: profileUserId
      ? { userId: profileUserId }
      : scope === "following"
        ? {
            OR: [
              { userId: currentUserId },
              {
                user: {
                  followers: {
                    some: { followerId: currentUserId },
                  },
                },
              },
            ],
          }
        : {},

    select: {
      id: true,
      type: true,
      achievementId: true,
      bookId: true,
      rating: true,
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

export const getSocialFeedPosts = async (
  currentUserId: string,
  limit = 30,
  scope = "all",
  profileUserId?: string,
) => {
  return prisma.socialPost.findMany({
    where: {
      parentId: null,
      activityId: null,
      ...(profileUserId
        ? { authorId: profileUserId }
        : scope === "following"
          ? {
            OR: [
              { authorId: currentUserId },
              {
                author: {
                  followers: {
                    some: { followerId: currentUserId },
                  },
                },
              },
            ],
          }
          : {}),
    },

    select: {
      id: true,
      text: true,
      bookId: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,

      author: {
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
          replies: true,
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

export const getSocialCommentCounts = async (
  postIds: string[],
  activityIds: string[],
) => {
  const [postReplies, activityComments] = await Promise.all([
    postIds.length
      ? prisma.$queryRaw<Array<{ rootId: string; count: bigint }>>`
          WITH RECURSIVE reply_tree AS (
            SELECT id, "parentId", "parentId" AS "rootId"
            FROM "SocialPost"
            WHERE "parentId" IN (${Prisma.join(postIds)})

            UNION ALL

            SELECT child.id, child."parentId", tree."rootId"
            FROM "SocialPost" child
            INNER JOIN reply_tree tree ON child."parentId" = tree.id
          )
          SELECT "rootId", COUNT(*)::bigint AS count
          FROM reply_tree
          GROUP BY "rootId"
        `
      : Promise.resolve([]),

    activityIds.length
      ? prisma.socialPost.groupBy({
          by: ["activityId"],
          where: {
            activityId: {
              in: activityIds,
            },
          },
          _count: {
            _all: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return {
    postReplies: new Map(
      postReplies.map((item) => [item.rootId, Number(item.count)]),
    ),
    activityComments: new Map(
      activityComments
        .filter((item) => item.activityId)
        .map((item) => [item.activityId as string, item._count._all]),
    ),
  };
};

export const getAchievementUnlockBook = async (
  userId: string,
  target: number,
) => {
  const item = await prisma.userBook.findFirst({
    where: {
      userId,
      status: "FINISHED",
      finishedAt: {
        not: null,
      },
    },

    orderBy: [
      {
        finishedAt: "asc",
      },
      {
        createdAt: "asc",
      },
    ],

    skip: Math.max(target - 1, 0),

    select: {
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          coverUrl: true,
        },
      },
    },
  });

  return item?.book ?? null;
};
