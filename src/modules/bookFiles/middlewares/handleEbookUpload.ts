import multer from "multer";
import type { Request, Response, NextFunction } from "express";

import { uploadEbook } from "./uploadEbook.js";

export const handleEbookUpload = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  uploadEbook.single("file")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          message: "Максимальний розмір електронної книги — 50 МБ",
        });
        return;
      }

      res.status(400).json({
        message: "Помилка завантаження файла",
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        message: error.message,
      });
      return;
    }

    next(error);
  });
};
