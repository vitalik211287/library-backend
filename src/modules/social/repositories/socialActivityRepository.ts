import type { Prisma } from "@prisma/client";
import prisma from "../../../utils/prisma.js";

export const reconcileAchievementActivities = async (
  userId: string,
  achievementIds: string[],
) => {
  const uniqueIds = [...new Set(achievementIds)];

  await prisma.$transaction(async (tx) => {
    await tx.socialActivity.deleteMany({
      where: {
        userId,
        type: "ACHIEVEMENT_UNLOCKED",

        ...(uniqueIds.length > 0
          ? {
              achievementId: {
                notIn: uniqueIds,
              },
            }
          : {}),
      },
    });

    for (const achievementId of uniqueIds) {
      await tx.socialActivity.upsert({
        where: {
          userId_type_achievementId: {
            userId,
            type: "ACHIEVEMENT_UNLOCKED",
            achievementId,
          },
        },

        update: {},

        create: {
          userId,
          type: "ACHIEVEMENT_UNLOCKED",
          achievementId,
        },
      });
    }
  });
};

export const getAchievementActivities = async (
  userId: string,
  achievementIds: string[],
  viewerUserId: string,
) => {
  if (achievementIds.length === 0) {
    return [];
  }

  return prisma.socialActivity.findMany({
    where: {
      userId,
      type: "ACHIEVEMENT_UNLOCKED",

      achievementId: {
        in: achievementIds,
      },
    },

    select: {
      id: true,
      achievementId: true,
      createdAt: true,

      kudos: {
        where: {
          userId: viewerUserId,
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
  });
};

export const createBookFinishedActivity = async (
  userId: string,
  bookId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma,
) => {
  return db.socialActivity.upsert({
    where: {
      userId_type_bookId: {
        userId,
        type: "BOOK_FINISHED",
        bookId,
      },
    },

    update: {},

    create: {
      userId,
      bookId,
      type: "BOOK_FINISHED",
    },
  });
};

export const createReadingStartedActivity = async (
  userId: string,
  bookId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma,
) => {
  return db.socialActivity.upsert({
    where: {
      userId_type_bookId: {
        userId,
        type: "READING_STARTED",
        bookId,
      },
    },

    update: {},

    create: {
      userId,
      bookId,
      type: "READING_STARTED",
    },
  });
};

export const upsertRatingAddedActivity = async (
  userId: string,
  bookId: string,
  rating: number,
  db: Prisma.TransactionClient | typeof prisma = prisma,
) => {
  return db.socialActivity.upsert({
    where: {
      userId_type_bookId: {
        userId,
        type: "RATING_ADDED",
        bookId,
      },
    },

    update: {
      rating,
    },

    create: {
      userId,
      bookId,
      type: "RATING_ADDED",
      rating,
    },
  });
};

export const removeRatingAddedActivity = async (
  userId: string,
  bookId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma,
) => {
  return db.socialActivity.deleteMany({
    where: {
      userId,
      bookId,
      type: "RATING_ADDED",
    },
  });
};
