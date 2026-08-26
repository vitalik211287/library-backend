import type {
  Request,
  Response,
} from "express";

import { finishUserReadingService } from "../services/finishUserReadingService.js";

export const finishUserReadingController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId = req.userId;
      const { bookId } = req.params;
      const { endPage } = req.body;

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
        await finishUserReadingService(
          userId,
          bookId,
          Number(endPage),
        );

      return res.status(200).json({
        session,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to finish reading",
      });
    }
  };