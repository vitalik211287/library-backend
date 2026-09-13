import { getSocialFeed } from "../repositories/socialFeedRepository.js";

export const getSocialFeedService = async (
  currentUserId: string,
) => {
  const activities = await getSocialFeed(currentUserId);

  return activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    createdAt: activity.createdAt,

    user: activity.user,

    book: activity.book,

    achievementId: activity.achievementId,

    kudosCount: activity._count.kudos,
    hasKudos: activity.kudos.length > 0,

    isOwnActivity: activity.user.id === currentUserId,
  }));
};