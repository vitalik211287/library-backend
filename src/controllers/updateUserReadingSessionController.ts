import type { Request, Response } from "express";

import { updateUserReadingSessionService } from "../services/userReadingSessionsService.js";

export const updateUserReadingSessionController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = res.locals.userId as string;

    const { bookId, sessionId } = req.params;

    if (typeof bookId !== "string") {
      res.status(400).json({
        message: "Book ID is required",
      });

      return;
    }

    if (typeof sessionId !== "string") {
      res.status(400).json({
        message: "Session ID is required",
      });

      return;
    }

    const { endPage, endPercent } = req.body as {
      endPage?: unknown;
      endPercent?: unknown;
    };

    const data: {
      endPage?: number;
      endPercent?: number;
    } = {};

    if (endPage !== undefined) {
      if (typeof endPage !== "number") {
        res.status(400).json({
          message: "End page must be a number",
        });

        return;
      }

      data.endPage = endPage;
    }

    if (endPercent !== undefined) {
      if (typeof endPercent !== "number") {
        res.status(400).json({
          message: "End percent must be a number",
        });

        return;
      }

      data.endPercent = endPercent;
    }

    if (data.endPage === undefined && data.endPercent === undefined) {
      res.status(400).json({
        message: "End page or end percent is required",
      });

      return;
    }

    const session = await updateUserReadingSessionService(
      userId,
      bookId,
      sessionId,
      data,
    );

    res.status(200).json(session);
  } catch (error) {
    console.error("Update reading session error:", error);

    if (error instanceof Error) {
      const notFoundErrors = [
        "Book not found",
        "Reading session not found",
        "User book not found",
      ];

      if (notFoundErrors.includes(error.message)) {
        res.status(404).json({
          message: error.message,
        });

        return;
      }

      const validationErrors = [
        "End page is required",
        "End page must be an integer",
        "End page cannot be less than start page",
        "End page cannot be greater than total book pages",
        "End percent is required",
        "End percent must be a number",
        "End percent must be between 0 and 100",
        "End percent cannot be less than start percent",
      ];

      if (validationErrors.includes(error.message)) {
        res.status(400).json({
          message: error.message,
        });

        return;
      }
    }

    res.status(500).json({
      message: "Failed to update reading session",
    });
  }
};
