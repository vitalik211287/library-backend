import {
  getAchievementUnlockBook,
  getSocialFeed,
} from "../repositories/socialFeedRepository.js";

import { ACHIEVEMENTS } from "../../stats/services/getUserAchievementsService.js";

export const getSocialFeedService = async (
  currentUserId: string,
) => {
  const activities = await getSocialFeed(currentUserId);

  return Promise.all(
    activities.map(async (activity) => {
      const achievement =
        activity.type === "ACHIEVEMENT_UNLOCKED"
          ? ACHIEVEMENTS.find(
              (item) => item.id === activity.achievementId,
            ) ?? null
          : null;

      const achievementBook =
        achievement?.category === "books"
          ? await getAchievementUnlockBook(
              activity.user.id,
              achievement.target,
            )
          : null;

      return {
        id: activity.id,
        type: activity.type,
        createdAt: activity.createdAt,

        user: activity.user,

        book: activity.book,
        rating: activity.rating,

        achievement: achievement
          ? {
              id: achievement.id,
              title: achievement.title,
              description: achievement.description,
              category: achievement.category,
              book: achievementBook,
            }
          : null,

        kudosCount: activity._count.kudos,
        hasKudos: activity.kudos.length > 0,

        isOwnActivity: activity.user.id === currentUserId,
      };
    }),
  );
};