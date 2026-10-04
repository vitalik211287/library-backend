import prisma from "../../../utils/prisma.js";

export const createNotification = async (data: {
  userId: string;
  actorId: string;
  type: "KUDOS_RECEIVED" | "POST_COMMENT" | "NEW_FOLLOWER";
  activityId?: string | null;
  postId?: string | null;
}) => {
  if (data.type === "POST_COMMENT" && data.postId) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        postId: data.postId,
      },
    });
  }

  if (data.postId) {
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        postId: data.postId,
      },
    });

    if (existingNotification) {
      return prisma.notification.update({
        where: {
          id: existingNotification.id,
        },
        data: {
          isRead: false,
          createdAt: new Date(),
        },
      });
    }

    return prisma.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        postId: data.postId,
      },
    });
  }
  if (data.type === "POST_COMMENT" && data.activityId) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        activityId: data.activityId,
      },
    });
  }

  if (data.activityId) {
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        activityId: data.activityId,
      },
    });

    if (existingNotification) {
      return prisma.notification.update({
        where: {
          id: existingNotification.id,
        },
        data: {
          isRead: false,
          createdAt: new Date(),
        },
      });
    }

    return prisma.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        activityId: data.activityId,
      },
    });
  }

  return prisma.notification.create({
    data: {
      userId: data.userId,
      actorId: data.actorId,
      type: data.type,
      activityId: null,
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
      postId: true,
      activity: {
        select: {
          id: true,
          type: true,
          rating: true,
          achievementId: true,

          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverUrl: true,
            },
          },
        },
      },

      isRead: true,
      createdAt: true,

      actor: {
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
  bookId: string;
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
      bookId: data.bookId,
    })),
  });
};

export const getSocialActivityNotificationRecipients = async (
  actorUserId: string,
) => {
  return prisma.userSocialPreference.findMany({
    where: {
      targetUserId: actorUserId,
      notifyActivity: true,

      user: {
        following: {
          some: {
            followingId: actorUserId,
          },
        },
      },
    },

    select: {
      userId: true,
    },
  });
};

export const createSocialActivityNotifications = async (data: {
  recipientUserIds: string[];
  actorId: string;
  activityId: string;
  bookId?: string | null;
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
      type: "SOCIAL_ACTIVITY",
      scope: "USER",
      activityId: data.activityId,
      bookId: data.bookId ?? null,
    })),

    skipDuplicates: true,
  });
};

export const deleteNotifications = async (
  notificationIds: string[],
  userId: string,
) => {
  return prisma.notification.deleteMany({
    where: {
      id: {
        in: notificationIds,
      },
      userId,
    },
  });
};
