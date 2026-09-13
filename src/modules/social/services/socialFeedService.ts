import { getSocialFeed } from "../repositories/socialFeedRepository.js";
import { ACHIEVEMENTS } from "../../stats/services/getUserAchievementsService.js";

export const getSocialFeedService = async (
  currentUserId: string,
) => {
  const activities = await getSocialFeed(currentUserId);

  return activities.map((activity) => {
    const achievement =
      activity.type === "ACHIEVEMENT_UNLOCKED"
        ? ACHIEVEMENTS.find(
            (item) => item.id === activity.achievementId,
          ) ?? null
        : null;

    return {
      id: activity.id,
      type: activity.type,
      createdAt: activity.createdAt,

      user: activity.user,

      book: activity.book,

      achievement: achievement
        ? {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            category: achievement.category,
          }
        : null,

      kudosCount: activity._count.kudos,
      hasKudos: activity.kudos.length > 0,

      isOwnActivity: activity.user.id === currentUserId,
    };
  });
};