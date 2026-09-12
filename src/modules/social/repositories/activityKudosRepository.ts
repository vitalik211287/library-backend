import prisma from "../../../utils/prisma.js";

export const addActivityKudos = async (
  activityId: string,
  userId: string,
) => {
  return prisma.activityKudos.upsert({
    where: {
      activityId_userId: {
        activityId,
        userId,
      },
    },

    update: {},

    create: {
      activityId,
      userId,
    },
  });
};

export const removeActivityKudos = async (
  activityId: string,
  userId: string,
) => {
  return prisma.activityKudos.deleteMany({
    where: {
      activityId,
      userId,
    },
  });
};

export const getActivityById = async (activityId: string) => {
  return prisma.socialActivity.findUnique({
    where: {
      id: activityId,
    },

    select: {
      id: true,
      userId: true,
      type: true,

      _count: {
        select: {
          kudos: true,
        },
      },

      kudos: true,
    },
  });
};

export const getActivityKudosUsers = async (activityId: string) => {
  return prisma.activityKudos.findMany({
    where: {
      activityId,
    },

    select: {
      createdAt: true,

      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};
