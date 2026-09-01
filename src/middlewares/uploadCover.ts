import multer, { type FileFilterCallback } from "multer";

import type { Request } from "express";

const storage = multer.memoryStorage();

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);

    return;
  }

  cb(new Error("Дозволені тільки зображення JPEG, PNG або WEBP"));
};

export const uploadCover = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});
