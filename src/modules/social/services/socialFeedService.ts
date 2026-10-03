import {
  getAchievementUnlockBook,
  getSocialFeed,
  getSocialFeedPosts,
} from "../repositories/socialFeedRepository.js";

import { ACHIEVEMENTS } from "../../stats/services/getUserAchievementsService.js";

export const getSocialFeedService = async (
  currentUserId: string,
  limit = 30,
  scope = "all",
) => {
  const [activities, posts] = await Promise.all([
    getSocialFeed(currentUserId, limit, scope),
    getSocialFeedPosts(currentUserId, limit, scope),
  ]);

  const activityItems = await Promise.all(
    activities.map(async (activity) => {
      const achievement =
        activity.type === "ACHIEVEMENT_UNLOCKED"
          ? (ACHIEVEMENTS.find((item) => item.id === activity.achievementId) ??
            null)
          : null;

      const achievementBook =
        achievement?.category === "books"
          ? await getAchievementUnlockBook(activity.user.id, achievement.target)
          : null;

      return {
        kind: "activity" as const,

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

  const postItems = posts.map((post) => ({
    kind: "post" as const,

    id: post.id,
    text: post.text,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,

    user: post.author,
    book: post.book,

    repliesCount: post._count.replies,

    kudosCount: post._count.kudos,
    hasKudos: post.kudos.length > 0,

    isOwnPost: post.author.id === currentUserId,
  }));

  return [...activityItems, ...postItems]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
};
