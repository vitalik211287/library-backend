import type { Request, Response, NextFunction } from "express";

import { assertCanEditLibraryBookService } from "../../libraries/services/librariesService.js";

export const canUploadBookFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.userId;
  const { libraryId, bookId } = req.params;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (
    typeof libraryId !== "string" ||
    typeof bookId !== "string" ||
    !libraryId ||
    !bookId
  ) {
    res.status(400).json({
      message: "Library ID and book ID are required",
    });
    return;
  }

  try {
    await assertCanEditLibraryBookService(userId, libraryId, bookId);
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "You do not have permission") {
        res.status(403).json({ message: error.message });
        return;
      }

      if (
        error.message === "Library not found" ||
        error.message === "Book not found in this library"
      ) {
        res.status(404).json({ message: error.message });
        return;
      }
    }

    next(error);
  }
};
