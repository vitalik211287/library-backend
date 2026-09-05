import type { Request, Response } from "express";

import { getUserStatsService } from "../services/getUserStatsService.js";

export const getUserStatsController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const currentYear = new Date().getUTCFullYear();

    const yearParam = req.query.year;

    let year = currentYear;

    if (typeof yearParam === "string") {
      const parsedYear = Number(yearParam);

      if (
        !Number.isInteger(parsedYear) ||
        parsedYear < 1900 ||
        parsedYear > currentYear + 1
      ) {
        return res.status(400).json({
          message: "Invalid year",
        });
      }

      year = parsedYear;
    }

    const timeZone =
      typeof req.query.timeZone === "string" ? req.query.timeZone : undefined;

    const stats = await getUserStatsService(userId, year, timeZone);

    return res.status(200).json({
      stats,
    });
  } catch (error) {
    console.error("Get user stats error:", error);

    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to get user stats",
    });
  }
};
