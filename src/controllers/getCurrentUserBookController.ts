import type {
  Request,
  Response,
} from "express";

import { getCurrentUserBookService } from "../services/getCurrentUserBookService.js";

export const getCurrentUserBookController =
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

      const result =
        await getCurrentUserBookService(
          userId,
        );

      return res
        .status(200)
        .json(result);
    } catch (error) {
      console.error(
        "Get current user book error:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to get current book",
      });
    }
  };