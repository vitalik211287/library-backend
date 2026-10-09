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

export const uploadBookCoverBuffer = (
  buffer: Buffer,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
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

        resolve(result.secure_url);
      },
    );

    stream.end(buffer);
  });
