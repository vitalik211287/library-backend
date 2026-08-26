import type {
  Request,
  Response,
} from "express";

import { getActiveUserReadingSessionService } from "../services/getActiveUserReadingSessionService.js";

export const getActiveUserReadingSessionController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId = req.userId;
      const { bookId } = req.params;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      if (typeof bookId !== "string") {
        return res.status(400).json({
          message: "Book ID is required",
        });
      }

      const result =
        await getActiveUserReadingSessionService(
          userId,
          bookId,
        );

      return res
        .status(200)
        .json(result);
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to get active session",
      });
    }
  };