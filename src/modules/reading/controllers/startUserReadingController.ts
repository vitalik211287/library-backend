import type { Request, Response } from "express";

import type { ProgressMode } from "@prisma/client";

import { startUserReadingService } from "../services/startUserReadingService.js";

export const startUserReadingController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;
    const { bookId } = req.params;

    const { progressMode, startPage, startPercent } = req.body;

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

    const normalizedProgressMode =
      progressMode === "PAGES" || progressMode === "PERCENT"
        ? (progressMode as ProgressMode)
        : undefined;

    const session = await startUserReadingService(userId, bookId, {
      ...(normalizedProgressMode !== undefined && {
        progressMode: normalizedProgressMode,
      }),

      ...(startPage !== undefined && {
        startPage: Number(startPage),
      }),

      ...(startPercent !== undefined && {
        startPercent: Number(startPercent),
      }),
    });

    return res.status(201).json({
      session,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Failed to start reading",
    });
  }
};
