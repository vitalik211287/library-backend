import type { Request, Response } from "express";
import {
  OfflineManualSyncError,
  syncOfflineManualSessionService,
} from "../services/syncOfflineManualSessionService.js";

export const syncOfflineManualSessionController = async (
  req: Request,
  res: Response,
) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { bookId } = req.params;
  if (typeof bookId !== "string") {
    return res.status(400).json({ message: "Book ID is required" });
  }

  try {
    const result = await syncOfflineManualSessionService(
      req.userId,
      bookId,
      req.body,
    );
    return res.status(result.alreadySynced ? 200 : 201).json(result);
  } catch (error) {
    const status = error instanceof OfflineManualSyncError ? error.status : 500;
    if (status === 500) console.error("Offline manual sync failed", error);
    return res.status(status).json({
      message: error instanceof OfflineManualSyncError
        ? error.message
        : "Unable to synchronize reading session",
    });
  }
};
