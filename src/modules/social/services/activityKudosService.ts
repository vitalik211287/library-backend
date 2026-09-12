import {
  addActivityKudos,
  getActivityById,
  getActivityKudosUsers,
  removeActivityKudos,
} from "../repositories/activityKudosRepository.js";

import { createKudosNotificationService } from "../../notifications/services/notificationsService.js";

export const addActivityKudosService = async (
  activityId: string,
  userId: string,
) => {
  const activity = await getActivityById(activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  if (activity.userId === userId) {
    throw new Error("You cannot give kudos to your own activity");
  }

  await addActivityKudos(activityId, userId);

  await createKudosNotificationService({
    recipientUserId: activity.userId,
    actorUserId: userId,
    activityId,
  });

  const updated = await getActivityById(activityId);

  return {
    success: true,
    hasKudos: true,
    kudosCount: updated?._count.kudos ?? 0,
  };
};

export const removeActivityKudosService = async (
  activityId: string,
  userId: string,
) => {
  const activity = await getActivityById(activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  await removeActivityKudos(activityId, userId);

  const updated = await getActivityById(activityId);

  return {
    success: true,
    hasKudos: false,
    kudosCount: updated?._count.kudos ?? 0,
  };
};


export const getActivityKudosUsersService = async (
  activityId: string,
) => {
  const activity = await getActivityById(activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  const items = await getActivityKudosUsers(activityId);

  return items.map((item) => ({
    givenAt: item.createdAt,
    id: item.user.id,
    name: item.user.name,
    avatarUrl: item.user.avatarUrl,
  }));
};


