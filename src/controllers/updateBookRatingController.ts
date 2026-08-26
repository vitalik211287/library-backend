import type { Request, Response } from "express";

import { updateBookRatingService } from "../services/updateBookRatingService.js";

export const updateBookRatingController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Book id is required",
      });
    }

    if (typeof rating !== "number") {
      return res.status(400).json({
        message: "Rating must be a number",
      });
    }

    const book = await updateBookRatingService(id, rating);

    res.status(200).json({
      message: "Book rating updated",
      book,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Book not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message === "Rating must be between 1 and 5") {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
