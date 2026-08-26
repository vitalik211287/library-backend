import type { Request, Response } from "express";

import { getActiveReadingSessionService } from "../services/getActiveReadingSessionService.js";

export const getActiveReadingSessionController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "Book id is required",
      });
    }

    const result = await getActiveReadingSessionService(id);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Book not found") {
        return res.status(404).json({
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