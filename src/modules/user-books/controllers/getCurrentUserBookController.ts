import type { Request, Response } from "express";

import { getCurrentUserBookService } from "../services/getCurrentUserBookService.js";

export const getCurrentUserBookController = async (
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

    const libraryId =
      typeof req.query.libraryId === "string" ? req.query.libraryId : undefined;

    const result = await getCurrentUserBookService(userId, libraryId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get current user books error:", error);

    if (error instanceof Error && error.message === "Library not found") {
      return res.status(404).json({
        message: "Library not found",
      });
    }

    return res.status(500).json({
      message: "Failed to get current books",
    });
  }
};
