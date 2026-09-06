import type { Request, Response } from "express";

import { getAllUserReadingSessionsService } from "../services/userReadingSessionsService.js";

export const getAllUserReadingSessionsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized",
      });

      return;
    }

    const sessions = await getAllUserReadingSessionsService(userId);

    res.status(200).json({
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error("Get all reading sessions error:", error);

    res.status(500).json({
      message: "Failed to get reading sessions",
    });
  }
};
