import type { Request, Response } from "express";
import { uploadBookCoverService } from "../services/uploadBookCoverService.js";

export const uploadBookCoverController = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({
      message: "Cover file is required",
    });
  }

  const coverUrl = req.file.path;

  const book = await uploadBookCoverService(id, coverUrl);

  res.json(book);
};