import type { Request, Response } from "express";

import { getUserAchievementsService } from "../../stats/services/getUserAchievementsService.js";
import { syncAchievementSocialActivitiesService } from "../../social/services/achievementSocialService.js";

import {
  followUserService,
  getFollowersService,
  getFollowingService,
  getPublicUserProfileService,
  searchUsersService,
  unfollowUserService,
} from "../services/socialService.js";

export const searchUsersController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const query = typeof req.query.q === "string" ? req.query.q : "";

    const users = await searchUsersService(userId, query);

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Search users error:", error);

    return res.status(500).json({
      message: "Failed to search users",
    });
  }
};

export const getPublicUserProfileController = async (
  req: Request,
  res: Response,
) => {
  try {
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { userId } = req.params;

    if (typeof userId !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const profile = await getPublicUserProfileService(userId, currentUserId);

    return res.status(200).json(profile);
  } catch (error) {
    console.error("Get public profile error:", error);

    if (error instanceof Error && error.message === "User not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to get user profile",
    });
  }
};

export const followUserController = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { userId } = req.params;

    if (typeof userId !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const result = await followUserService(currentUserId, userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Follow user error:", error);

    if (error instanceof Error) {
      const status = error.message === "User not found" ? 404 : 400;

      return res.status(status).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to follow user",
    });
  }
};

export const unfollowUserController = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { userId } = req.params;

    if (typeof userId !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const result = await unfollowUserService(currentUserId, userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Unfollow user error:", error);

    if (error instanceof Error) {
      const status = error.message === "User not found" ? 404 : 400;

      return res.status(status).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to unfollow user",
    });
  }
};

export const getFollowingController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const users = await getFollowingService(userId);

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get following error:", error);

    return res.status(500).json({
      message: "Failed to get following",
    });
  }
};

export const getFollowersController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const users = await getFollowersService(userId);

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get followers error:", error);

    return res.status(500).json({
      message: "Failed to get followers",
    });
  }
};

export const getUserFollowingController = async (
  req: Request,
  res: Response,
) => {
  try {
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { userId } = req.params;

    if (typeof userId !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const users = await getFollowingService(userId, currentUserId);

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get user following error:", error);

    return res.status(500).json({
      message: "Failed to get user following",
    });
  }
};

export const getUserFollowersController = async (
  req: Request,
  res: Response,
) => {
  try {
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { userId } = req.params;

    if (typeof userId !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const users = await getFollowersService(userId, currentUserId);

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get user followers error:", error);

    return res.status(500).json({
      message: "Failed to get user followers",
    });
  }
};


export const getPublicUserAchievementsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { userId } = req.params;

    if (typeof userId !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const timeZone =
      typeof req.query.timeZone === "string"
        ? req.query.timeZone
        : undefined;

    const data = await getUserAchievementsService(userId, timeZone);

    const socialMap = await syncAchievementSocialActivitiesService(
      userId,
      data.achievements,
      currentUserId,
    );

    const unlockedAchievements = data.achievements
      .filter((achievement) => achievement.unlocked)
      .map((achievement) => {
        const social = socialMap.get(achievement.id);

        return {
          ...achievement,

          activityId: social?.activityId ?? null,
          kudosCount: social?.kudosCount ?? 0,
          hasKudos: social?.hasKudos ?? false,
          unlockedAt: social?.createdAt ?? null,
        };
      });

    return res.status(200).json({
      summary: data.summary,
      achievements: unlockedAchievements,
    });
  } catch (error) {
    console.error("Get public user achievements error:", error);

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to get user achievements",
    });
  }
};


