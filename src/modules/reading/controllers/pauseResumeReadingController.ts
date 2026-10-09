import type { Request, Response } from "express";

import { pauseUserReadingService } from "../services/pauseUserReadingService.js";
import { resumeUserReadingService } from "../services/resumeUserReadingService.js";

type ReadingAction = "pause" | "resume";

const createReadingController = (action: ReadingAction) => {
  const service =
    action === "pause"
      ? pauseUserReadingService
      : resumeUserReadingService;

  return async (req: Request, res: Response) => {
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

      const session = await service(userId, bookId);

      return res.status(200).json({ session });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to " + action + " reading",
      });
    }
  };
};

export const pauseUserReadingController =
  createReadingController("pause");

export const resumeUserReadingController =
  createReadingController("resume");
