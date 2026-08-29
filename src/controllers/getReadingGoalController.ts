import type { Request, Response } from "express";

import { getReadingGoalService } from "../services/getReadingGoalService.js";

export const getReadingGoalController = async (req: Request, res: Response) => {
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
        parsedYear > currentYear + 10
      ) {
        return res.status(400).json({
          message: "Invalid year",
        });
      }

      year = parsedYear;
    }

    const goal = await getReadingGoalService(userId, year);

    return res.status(200).json({
      goal,
    });
  } catch (error) {
    console.error("Get reading goal error:", error);

    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to get reading goal",
    });
  }
};
