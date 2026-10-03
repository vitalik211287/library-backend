import {
  getAchievementUnlockBook,
  getSocialCommentCounts,
  getSocialFeed,
  getSocialFeedPosts,
} from "../repositories/socialFeedRepository.js";

import { ACHIEVEMENTS } from "../../stats/services/getUserAchievementsService.js";

export const getSocialFeedService = async (
  currentUserId: string,
  limit = 20,
  scope = "all",
  page = 1,
  profileUserId?: string,
) => {
  const offset = (page - 1) * limit;
  const fetchLimit = offset + limit + 1;

  const [activities, posts] = await Promise.all([
    getSocialFeed(currentUserId, fetchLimit, scope, profileUserId),
    getSocialFeedPosts(currentUserId, fetchLimit, scope, profileUserId),
  ]);

  const { postReplies, activityComments } = await getSocialCommentCounts(
    posts.map((post) => post.id),
    activities.map((activity) => activity.id),
  );

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
        commentsCount: activityComments.get(activity.id) ?? 0,

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

    repliesCount: postReplies.get(post.id) ?? 0,

    kudosCount: post._count.kudos,
    hasKudos: post.kudos.length > 0,

    isOwnPost: post.author.id === currentUserId,
  }));

  const sortedItems = [...activityItems, ...postItems].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const pageItems = sortedItems.slice(offset, offset + limit);
  const hasMore = sortedItems.length > offset + limit;

  return {
    activities: pageItems,
    page,
    hasMore,
  };
};
