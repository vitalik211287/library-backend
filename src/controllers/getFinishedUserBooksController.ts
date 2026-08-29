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

      const rawPage = Number(
        req.query.page ?? 1,
      );

      const rawLimit = Number(
        req.query.limit ?? 12,
      );

      const page =
        Number.isInteger(rawPage) &&
        rawPage > 0
          ? rawPage
          : 1;

      const limit =
        Number.isInteger(rawLimit) &&
        rawLimit > 0
          ? Math.min(rawLimit, 100)
          : 12;

      const result =
        await getFinishedUserBooksService(
          userId,
          page,
          limit,
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