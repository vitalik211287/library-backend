import {
  followUser,
  getFollowers,
  getFollowing,
  getPublicUserById,
  getUserById,
  searchUsers,
  unfollowUser,
} from "../repositories/usersRepository.js";

import { createNewFollowerNotificationService } from "../../notifications/services/notificationsService.js";

export const searchUsersService = async (
  currentUserId: string,
  query: string,
) => {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const users = await searchUsers(currentUserId, normalizedQuery);

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,

    isFollowing: user.followers.length > 0,

    followersCount: user._count.followers,

    followingCount: user._count.following,
  }));
};

export const getPublicUserProfileService = async (
  userId: string,
  currentUserId: string,
) => {
  const user = await getPublicUserById(userId, currentUserId);

  if (!user) {
    throw new Error("User not found");
  }

  const readingBooks = user.books.filter((item) => item.status === "READING");

  const finishedBooks = user.books.filter((item) => item.status === "FINISHED");

  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,

    isOwnProfile: user.id === currentUserId,

    isFollowing: user.followers.length > 0,

    followersCount: user._count.followers,

    followingCount: user._count.following,

    reading: {
      count: readingBooks.length,

      books: readingBooks,
    },

    finished: {
      count: finishedBooks.length,

      books: finishedBooks,
    },
  };
};

export const followUserService = async (
  currentUserId: string,
  targetUserId: string,
) => {
  if (currentUserId === targetUserId) {
    throw new Error("You cannot follow yourself");
  }

  const targetUser = await getUserById(targetUserId);

  if (!targetUser) {
    throw new Error("User not found");
  }

  await followUser(currentUserId, targetUserId);

  await createNewFollowerNotificationService({
    recipientUserId: targetUserId,
    actorUserId: currentUserId,
  });

  return {
    success: true,
    isFollowing: true,
  };
};

export const unfollowUserService = async (
  currentUserId: string,
  targetUserId: string,
) => {
  if (currentUserId === targetUserId) {
    throw new Error("You cannot unfollow yourself");
  }

  const targetUser = await getUserById(targetUserId);

  if (!targetUser) {
    throw new Error("User not found");
  }

  await unfollowUser(currentUserId, targetUserId);

  return {
    success: true,
    isFollowing: false,
  };
};

export const getFollowingService = async (
  targetUserId: string,
  currentUserId: string = targetUserId,
) => {
  const items = await getFollowing(targetUserId, currentUserId);

  return items.map((item) => ({
    followedAt: item.createdAt,

    id: item.following.id,

    name: item.following.name,

    avatarUrl: item.following.avatarUrl,

    isCurrentUser: item.following.id === currentUserId,

    isFollowing: item.following.followers.length > 0,

    followersCount: item.following._count.followers,

    followingCount: item.following._count.following,
  }));
};

export const getFollowersService = async (
  targetUserId: string,
  currentUserId: string = targetUserId,
) => {
  const items = await getFollowers(targetUserId, currentUserId);

  return items.map((item) => ({
    followedAt: item.createdAt,

    id: item.follower.id,

    name: item.follower.name,

    avatarUrl: item.follower.avatarUrl,

    isCurrentUser: item.follower.id === currentUserId,

    isFollowing: item.follower.followers.length > 0,

    followersCount: item.follower._count.followers,

    followingCount: item.follower._count.following,
  }));
};




