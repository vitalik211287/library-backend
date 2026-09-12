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
