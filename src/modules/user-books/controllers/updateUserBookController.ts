import type { Request, Response } from "express";

import type { ProgressMode, ReadingStatus } from "@prisma/client";

import { updateUserBookService } from "../services/updateUserBookService.js";

type UpdateUserBookBody = {
  progressMode?: ProgressMode;
  currentPage?: number;
  currentPercent?: number;
  status?: ReadingStatus;
  rating?: number | null;
};

export const updateUserBookController = async (req: Request, res: Response) => {
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

    const { progressMode, currentPage, currentPercent, status, rating } =
      req.body as UpdateUserBookBody;

    const data: UpdateUserBookBody = {};

    if (progressMode !== undefined) {
      if (progressMode !== "PAGES" && progressMode !== "PERCENT") {
        return res.status(400).json({
          message: "Invalid progress mode",
        });
      }

      data.progressMode = progressMode;
    }

    if (currentPage !== undefined) {
      data.currentPage = Number(currentPage);
    }

    if (currentPercent !== undefined) {
      data.currentPercent = Number(currentPercent);
    }

    if (status !== undefined) {
      if (
        status !== "NOT_STARTED" &&
        status !== "READING" &&
        status !== "PAUSED" &&
        status !== "FINISHED"
      ) {
        return res.status(400).json({
          message: "Invalid reading status",
        });
      }

      data.status = status;
    }

    if (rating !== undefined) {
      data.rating = rating === null ? null : Number(rating);
    }

    const userBook = await updateUserBookService(userId, bookId, data);

    return res.status(200).json(userBook);
  } catch (error) {
    console.error("Update user book error:", error);

    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to update reading data",
    });
  }
};
