import prisma from "../../../utils/prisma.js";

export const createNotification = async (data: {
  userId: string;
  actorId: string;
  type: "KUDOS_RECEIVED" | "NEW_FOLLOWER";
  activityId?: string | null;
}) => {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      actorId: data.actorId,
      type: data.type,
      activityId: data.activityId ?? null,
    },
  });
};

export const getNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: {
      userId,
    },

    select: {
      id: true,
      type: true,
      activityId: true,
      isRead: true,
      createdAt: true,

      actor: {
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

    take: 50,
  });
};

export const getUnreadNotificationsCount = async (userId: string) => {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
};

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string,
) => {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },

    data: {
      isRead: true,
    },
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },

    data: {
      isRead: true,
    },
  });
};

export const createLibraryNotifications = async (data: {
  recipientUserIds: string[];
  actorId: string;
  libraryId: string;
}) => {
  if (data.recipientUserIds.length === 0) {
    return {
      count: 0,
    };
  }

  return prisma.notification.createMany({
    data: data.recipientUserIds.map((userId) => ({
      userId,
      actorId: data.actorId,
      type: "LIBRARY_BOOK_ADDED",
      scope: "LIBRARY",
      libraryId: data.libraryId,
    })),
  });
};
