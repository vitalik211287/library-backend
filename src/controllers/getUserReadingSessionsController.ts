import type { Request, Response } from "express";

import { getUserReadingSessionsService } from "../services/userReadingSessionsService.js";

export const getUserReadingSessionsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = res.locals.userId as string;

    const { bookId } = req.params;

    if (typeof bookId !== "string") {
      res.status(400).json({
        message: "Book ID is required",
      });

      return;
    }

    const sessions = await getUserReadingSessionsService(userId, bookId);

    res.status(200).json({
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error("Get reading sessions error:", error);

    if (error instanceof Error && error.message === "Book not found") {
      res.status(404).json({
        message: error.message,
      });

      return;
    }

    res.status(500).json({
      message: "Failed to get reading sessions",
    });
  }
};
