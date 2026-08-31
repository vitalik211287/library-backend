import type { Request, Response } from "express";

import { deleteUserReadingSessionService } from "../services/userReadingSessionsService.js";

export const deleteUserReadingSessionController = async (
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

    const result = await deleteUserReadingSessionService(
      userId,
      bookId,
      sessionId,
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Delete reading session error:", error);

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
    }

    res.status(500).json({
      message: "Failed to delete reading session",
    });
  }
};
