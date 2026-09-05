import type {
  Request,
  Response,
} from "express";

import { pauseUserReadingService } from "../services/pauseUserReadingService.js";

export const pauseUserReadingController =
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

      const session =
        await pauseUserReadingService(
          userId,
          bookId,
        );

      return res.status(200).json({
        session,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to pause reading",
      });
    }
  };