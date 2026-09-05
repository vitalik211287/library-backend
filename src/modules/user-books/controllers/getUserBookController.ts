import type { Request, Response } from "express";

import { getUserBookService } from "../services/getUserBookService.js";

export const getUserBookController = async (
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

    const userBook = await getUserBookService(
      userId,
      bookId,
    );

    res.status(200).json(userBook);
  } catch (error) {
    console.error(
      "Get user book error:",
      error,
    );

    res.status(500).json({
      message: "Failed to get reading data",
    });
  }
};