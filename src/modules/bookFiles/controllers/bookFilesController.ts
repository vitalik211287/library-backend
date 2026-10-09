import { downloadBookFileService } from "../services/bookFilesService.js";
import type { Request, Response } from "express";

import { getBookFilesService } from "../services/bookFilesService.js";

export const getBookFilesController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.userId;
  const { libraryId, bookId } = req.params;

  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  if (typeof libraryId !== "string" || typeof bookId !== "string" || !libraryId || !bookId) {
    return res.status(400).json({
      message: "Library ID and book ID are required",
    });
  }

  try {
    const files = await getBookFilesService(
      userId,
      libraryId,
      bookId,
    );

    return res.status(200).json(files);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Library not found" ||
        error.message === "Book not found in this library"
      ) {
        return res.status(404).json({
          message: error.message,
        });
      }
    }

    console.error("Get book files error:", error);

    return res.status(500).json({
      message: "Failed to get book files",
    });
  }
};

import { addBookFileService } from "../services/bookFilesService.js";

export const addBookFileController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.userId;
  const { libraryId, bookId } = req.params;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (
    typeof libraryId !== "string" ||
    typeof bookId !== "string" ||
    !libraryId ||
    !bookId
  ) {
    return res.status(400).json({
      message: "Library ID and book ID are required",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      message: "Ebook file is required",
    });
  }

  try {
    const savedFile = await addBookFileService(
      userId,
      libraryId,
      bookId,
      req.file,
    );

    return res.status(201).json(savedFile);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Library not found" ||
        error.message === "Book not found in this library"
      ) {
        return res.status(404).json({ message: error.message });
      }

      if (error.message === "You do not have permission") {
        return res.status(403).json({ message: error.message });
      }

      if (error.message === "Invalid or unsupported ebook format") {
        return res.status(400).json({ message: error.message });
      }
    }

    console.error("Add book file error:", error);

    return res.status(500).json({
      message: "Failed to upload ebook",
    });
  }
};

export const downloadBookFileController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.userId;
  const { libraryId, bookId, fileId } = req.params;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (
    typeof libraryId !== "string" ||
    typeof bookId !== "string" ||
    typeof fileId !== "string" ||
    !libraryId ||
    !bookId ||
    !fileId
  ) {
    return res.status(400).json({
      message: "Library ID, book ID and file ID are required",
    });
  }

  try {
    const file = await downloadBookFileService(
      userId,
      libraryId,
      bookId,
      fileId,
    );

    const safeFileName = file.fileName
      .replace(/[\r\n"\\]/g, "_")
      .replace(/[^\x20-\x7E]/g, "_");

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Length", file.sizeBytes);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFileName || "ebook"}"`,
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    file.stream.on("error", (error) => {
      console.error("Book file stream error:", error);
      if (!res.headersSent) {
        res.status(502).json({ message: "Failed to download ebook" });
      } else {
        res.destroy(error);
      }
    });

    file.stream.pipe(res);
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "Library not found",
        "Book not found in this library",
        "Book file not found",
      ].includes(error.message)
    ) {
      return res.status(404).json({ message: error.message });
    }

    console.error("Download book file error:", error);

    return res.status(500).json({
      message: "Failed to download ebook",
    });
  }
};
