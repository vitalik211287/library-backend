import cloudinary from "../config/cloudinary.js";

export const uploadBookCover = async (
  imageUrl: string,
  isbn: string,
): Promise<string> => {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: "library/covers",
    public_id: isbn,
    overwrite: true,
    resource_type: "image",
  });

  return result.secure_url;
};