import type { Request, Response } from "express";

import { updateReadingGoalService } from "../services/updateReadingGoalService.js";

export const updateReadingGoalController = async (
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

    const { booksGoal, pagesGoal, minutesGoal } = req.body;

    if (
      booksGoal === undefined &&
      pagesGoal === undefined &&
      minutesGoal === undefined
    ) {
      return res.status(400).json({
        message: "At least one goal is required",
      });
    }

    const goal = await updateReadingGoalService(userId, year, {
      booksGoal,
      pagesGoal,
      minutesGoal,
    });

    return res.status(200).json({
      goal,
    });
  } catch (error) {
    console.error("Update reading goal error:", error);

    if (error instanceof Error && error.message.includes("must be")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to update reading goal",
    });
  }
};
