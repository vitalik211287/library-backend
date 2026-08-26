import type { Request, Response } from "express";

import { getUserBookService } from "../services/getUserBookService.js";

export const getUserBookController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = res.locals.userId as string;
    const { bookId } = req.params;

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