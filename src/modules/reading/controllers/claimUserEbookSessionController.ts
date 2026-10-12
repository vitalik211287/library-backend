import type { Request, Response } from "express";
import { claimUserEbookSessionService } from "../services/claimUserEbookSessionService.js";

export const claimUserEbookSessionController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.userId;
  const { bookId } = req.params;
  const sessionId = req.body?.sessionId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (
    typeof bookId !== "string" ||
    typeof sessionId !== "string" ||
    !sessionId.trim()
  ) {
    return res.status(400).json({
      message: "Book ID and session ID are required",
    });
  }

  try {
    const result = await claimUserEbookSessionService(
      userId,
      bookId,
      sessionId,
    );

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Unable to recover EPUB session";

    const conflicts = [
      "No recoverable EPUB session",
      "EPUB session is still active",
      "Invalid EPUB session time",
      "EPUB recovery conflict",
    ];

    return res.status(conflicts.includes(message) ? 409 : 500)
      .json({ message });
  }
};
