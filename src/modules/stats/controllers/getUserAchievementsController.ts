import type { Request, Response } from "express";

import { getUserAchievementsService } from "../services/getUserAchievementsService.js";

export const getUserAchievementsController = async (
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

    const timeZone =
      typeof req.query.timeZone === "string" ? req.query.timeZone : undefined;

    const achievements = await getUserAchievementsService(userId, timeZone);

    return res.status(200).json(achievements);
  } catch (error) {
    console.error("Get achievements error:", error);

    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to get achievements",
    });
  }
};
