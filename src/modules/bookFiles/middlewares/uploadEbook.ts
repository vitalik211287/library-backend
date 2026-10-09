import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";

const MAX_EBOOK_SIZE = 50 * 1024 * 1024;

const allowedExtensions = [".epub", ".fb2", ".pdf"];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const fileName = file.originalname.toLowerCase();

  if (allowedExtensions.some((ext) => fileName.endsWith(ext))) {
    cb(null, true);
    return;
  }

  cb(new Error("Дозволені лише файли EPUB, FB2 або PDF"));
};

export const uploadEbook = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_EBOOK_SIZE,
    files: 1,
  },
});
