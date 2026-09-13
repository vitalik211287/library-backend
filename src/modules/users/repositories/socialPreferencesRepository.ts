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

export const setSocialNotificationPreference = async (
  userId: string,
  targetUserId: string,
  muteNotifications: boolean,
) => {
  return prisma.userSocialPreference.upsert({
    where: {
      userId_targetUserId: {
        userId,
        targetUserId,
      },
    },

    update: {
      muteNotifications,
    },

    create: {
      userId,
      targetUserId,
      muteNotifications,
    },
  });
};

export const areSocialNotificationsMuted = async (
  userId: string,
  actorUserId: string,
) => {
  const preference = await getSocialPreference(
    userId,
    actorUserId,
  );

  return preference?.muteNotifications ?? false;
};