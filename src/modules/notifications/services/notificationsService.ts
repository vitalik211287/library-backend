import {
  createNotification,
  createLibraryNotifications,
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../repositories/notificationsRepository.js";

export const createKudosNotificationService = async ({
  recipientUserId,
  actorUserId,
  activityId,
}: {
  recipientUserId: string;
  actorUserId: string;
  activityId: string;
}) => {
  if (recipientUserId === actorUserId) {
    return null;
  }

  return createNotification({
    userId: recipientUserId,
    actorId: actorUserId,
    type: "KUDOS_RECEIVED",
    activityId,
  });
};

export const createNewFollowerNotificationService = async ({
  recipientUserId,
  actorUserId,
}: {
  recipientUserId: string;
  actorUserId: string;
}) => {
  if (recipientUserId === actorUserId) {
    return null;
  }

  return createNotification({
    userId: recipientUserId,
    actorId: actorUserId,
    type: "NEW_FOLLOWER",
  });
};


export const getNotificationsService = async (userId: string) => {
  return getNotifications(userId);
};

export const getUnreadNotificationsCountService = async (
  userId: string,
) => {
  return getUnreadNotificationsCount(userId);
};

export const markNotificationAsReadService = async (
  notificationId: string,
  userId: string,
) => {
  return markNotificationAsRead(notificationId, userId);
};

export const markAllNotificationsAsReadService = async (
  userId: string,
) => {
  return markAllNotificationsAsRead(userId);
};

export const createLibraryBookAddedNotificationsService = async ({
  libraryId,
  actorUserId,
  memberUserIds,
}: {
  libraryId: string;
  actorUserId: string;
  memberUserIds: string[];
}) => {
  const recipientUserIds = [
    ...new Set(
      memberUserIds.filter(
        (userId) => userId !== actorUserId,
      ),
    ),
  ];

  return createLibraryNotifications({
    recipientUserIds,
    actorId: actorUserId,
    libraryId,
  });
};
