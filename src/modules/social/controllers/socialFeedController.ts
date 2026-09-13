import type { Request, Response } from "express";

import { getSocialFeedService } from "../services/socialFeedService.js";

export const getSocialFeedController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const activities = await getSocialFeedService(userId);

    return res.status(200).json({
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Get social feed error:", error);

    return res.status(500).json({
      message: "Failed to get social feed",
    });
  }
};