import type { Request, Response } from "express";
import cloudinary from "../../../config/cloudinary.js";
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

  const file = req.file;

  const result = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "library/covers",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result) {
            reject(new Error("Cloudinary upload failed"));
            return;
          }

          resolve({
            secure_url: result.secure_url,
          });
        },
      );

      uploadStream.end(file.buffer);
    },
  );

  const book = await uploadBookCoverService(
    id,
    result.secure_url,
  );

  res.json(book);
};
