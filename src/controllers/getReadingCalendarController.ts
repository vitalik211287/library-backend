import type {
  Request,
  Response,
} from "express";

import { getReadingCalendarService } from "../services/getReadingCalendarService.js";

export const getReadingCalendarController =
  async (
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

      const year = Number(
        req.query.year,
      );

      const month = Number(
        req.query.month,
      );

      const calendar =
        await getReadingCalendarService(
          userId,
          year,
          month,
        );

      return res
        .status(200)
        .json(calendar);
    } catch (error) {
      console.error(
        "Get reading calendar error:",
        error,
      );

      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to get reading calendar",
      });
    }
  };