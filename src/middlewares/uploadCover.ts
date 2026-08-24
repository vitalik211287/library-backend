import multer, { type FileFilterCallback } from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import type { Request } from "express";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "library/covers",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  }),
});

const fileFilter = function (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Дозволені тільки зображення JPEG, PNG або WEBP"));
  }
};

export const uploadCover = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});