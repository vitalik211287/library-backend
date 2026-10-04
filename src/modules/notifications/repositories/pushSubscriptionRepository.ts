import prisma from "../../../utils/prisma.js";

export const upsertPushSubscription = async ({
  userId,
  endpoint,
  p256dh,
  auth,
}: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}) => {
  return prisma.pushSubscription.upsert({
    where: {
      endpoint,
    },
    update: {
      userId,
      p256dh,
      auth,
    },
    create: {
      userId,
      endpoint,
      p256dh,
      auth,
    },
  });
};

export const deletePushSubscription = async ({
  userId,
  endpoint,
}: {
  userId: string;
  endpoint: string;
}) => {
  return prisma.pushSubscription.deleteMany({
    where: {
      userId,
      endpoint,
    },
  });
};

export const getPushSubscriptionsByUserId = async (userId: string) => {
  return prisma.pushSubscription.findMany({
    where: {
      userId,
    },
  });
};
