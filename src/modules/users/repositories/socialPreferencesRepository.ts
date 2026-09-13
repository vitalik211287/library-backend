import prisma from "../../../utils/prisma.js";

export const getSocialPreference = async (
  userId: string,
  targetUserId: string,
) => {
  return prisma.userSocialPreference.findUnique({
    where: {
      userId_targetUserId: {
        userId,
        targetUserId,
      },
    },
  });
};

export const setSocialActivityNotificationPreference = async (
  userId: string,
  targetUserId: string,
  notifyActivity: boolean,
) => {
  return prisma.userSocialPreference.upsert({
    where: {
      userId_targetUserId: {
        userId,
        targetUserId,
      },
    },

    update: {
      notifyActivity,
    },

    create: {
      userId,
      targetUserId,
      notifyActivity,
    },
  });
};