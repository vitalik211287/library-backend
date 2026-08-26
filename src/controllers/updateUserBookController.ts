import type { Request, Response } from "express";
import type { ReadingStatus } from "@prisma/client";

import { updateUserBookService } from "../services/updateUserBookService.js";

type UpdateUserBookBody = {
  currentPage?: number;
  status?: ReadingStatus;
  rating?: number | null;
};

export const updateUserBookController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;
    const { bookId } = req.params;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized",
      });

      return;
    }

    if (typeof bookId !== "string") {
      res.status(400).json({
        message: "Book ID is required",
      });

      return;
    }

    const {
      currentPage,
      status,
      rating,
    } = req.body as UpdateUserBookBody;

    const data: UpdateUserBookBody = {};

    if (currentPage !== undefined) {
      data.currentPage = currentPage;
    }

    if (status !== undefined) {
      data.status = status;
    }

    if (rating !== undefined) {
      data.rating = rating;
    }

    const userBook = await updateUserBookService(
      userId,
      bookId,
      data,
    );

    res.status(200).json(userBook);
  } catch (error) {
    console.error(
      "Update user book error:",
      error,
    );

    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to update reading data",
    });
  }
};