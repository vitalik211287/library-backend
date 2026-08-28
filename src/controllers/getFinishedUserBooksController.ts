import type {
  Request,
  Response,
} from "express";

import { getFinishedUserBooksService } from "../services/getFinishedUserBooksService.js";

export const getFinishedUserBooksController =
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
        await getFinishedUserBooksService(
          userId,
        );

      return res
        .status(200)
        .json(result);
    } catch (error) {
      console.error(
        "Get finished user books error:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to get finished books",
      });
    }
  };