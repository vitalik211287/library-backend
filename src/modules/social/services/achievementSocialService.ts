import { createSocialActivityNotificationsService } from "../../notifications/services/notificationsService.js";

import {
  getAchievementActivities,
  reconcileAchievementActivities,
} from "../repositories/socialActivityRepository.js";

type AchievementForSocial = {
  id: string;
  unlocked: boolean;
};

export const syncAchievementSocialActivitiesService = async (
  userId: string,
  achievements: AchievementForSocial[],
  viewerUserId: string,
) => {
  const unlockedIds = achievements
    .filter((achievement) => achievement.unlocked)
    .map((achievement) => achievement.id);

  await reconcileAchievementActivities(userId, unlockedIds);

  const activities = await getAchievementActivities(
    userId,
    unlockedIds,
    viewerUserId,
  );

  for (const activity of activities) {
    await createSocialActivityNotificationsService({
      actorUserId: userId,
      activityId: activity.id,
      bookId: null,
    });
  }

  return new Map(
    activities.map((activity) => [
      activity.achievementId,
      {
        activityId: activity.id,
        kudosCount: activity._count.kudos,
        hasKudos: activity.kudos.length > 0,
        createdAt: activity.createdAt,
      },
    ]),
  );
};
