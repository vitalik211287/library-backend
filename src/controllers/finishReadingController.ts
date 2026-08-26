import type { Request, Response } from "express";

import { finishReadingService } from "../services/finishReadingService.js";

export const finishReadingController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { endPage } = req.body;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Book id is required",
      });
    }

    if (typeof endPage !== "number") {
      return res.status(400).json({
        message: "End page must be a number",
      });
    }

    const session = await finishReadingService(id, endPage);

    res.status(200).json({
      message: "Reading session finished",
      session,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Book not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message === "Active reading session not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message === "End page cannot be less than start page" ||
        error.message === "End page cannot be greater than total pages"
      ) {
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