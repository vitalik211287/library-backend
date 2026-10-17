import type { Request, Response } from "express";
import {
  OfflineEbookSyncError,
} from "../services/offlineEbookSyncValidation.js";
import { syncOfflineEbookSessionService } from "../services/syncOfflineEbookSessionService.js";

export const syncOfflineEbookSessionController = async (
  req: Request,
  res: Response,
) => {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
  const { bookId } = req.params;
  if (typeof bookId !== "string") {
    return res.status(400).json({ message: "Book ID is required" });
  }
  try {
    const result = await syncOfflineEbookSessionService(req.userId, bookId, req.body);
    return res.status(result.alreadySynced ? 200 : 201).json(result);
  } catch (error) {
    const status = error instanceof OfflineEbookSyncError ? error.status : 500;
    if (status === 500) console.error("Offline EPUB sync failed", error);
    return res.status(status).json({
      message: error instanceof OfflineEbookSyncError
        ? error.message
        : "Unable to synchronize EPUB reading session",
    });
  }
};
