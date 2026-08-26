import type { Request, Response } from "express";
import { startReadingService } from "../services/startReadingService.js";

export const startReadingController = async (
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

    const session = await startReadingService(id);

    res.status(201).json({
      message: "Reading session started",
      session,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Book not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message === "Reading session already started") {
        return res.status(409).json({
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