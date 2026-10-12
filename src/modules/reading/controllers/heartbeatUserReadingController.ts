import type { Request, Response } from "express";
import { heartbeatUserReadingService } from "../services/heartbeatUserReadingService.js";

export const heartbeatUserReadingController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.userId;
  const { bookId } = req.params;
  const sessionId = req.body?.sessionId;
  const readerLeaseId = req.body?.readerLeaseId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (
    typeof bookId !== "string" ||
    typeof sessionId !== "string" ||
    !sessionId.trim() ||
    typeof readerLeaseId !== "string" ||
    !readerLeaseId.trim()
  ) {
    return res.status(400).json({
      message: "Book ID and session ID are required",
    });
  }

  try {
    const heartbeat = await heartbeatUserReadingService(
      userId,
      bookId,
      sessionId,
      readerLeaseId,
    );

    return res.status(200).json({ heartbeat });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Heartbeat failed";

    const conflict = [
      "No active heartbeat-enabled EPUB session",
      "Invalid EPUB heartbeat state",
      "EPUB heartbeat update conflict",
    ].includes(message);

    return res.status(conflict ? 409 : 500).json({ message });
  }
};
