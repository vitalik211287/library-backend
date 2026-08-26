import type { Request, Response } from "express";

import { getReadingCalendarService } from "../services/getReadingCalendarService.js";

export const getReadingCalendarController = async (
  req: Request,
  res: Response,
) => {
  try {
    const calendar = await getReadingCalendarService();

    res.status(200).json({
      calendar,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
