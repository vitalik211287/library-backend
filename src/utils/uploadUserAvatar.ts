import cloudinary from "../config/cloudinary.js";

export const uploadUserAvatar = async (
  imageBuffer: Buffer,
  userId: string,
): Promise<string> => {
  const base64Image =
    `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

  const result =
    await cloudinary.uploader.upload(
      base64Image,
      {
        folder:
          "library/avatars",

        public_id:
          userId,

        overwrite:
          true,

        resource_type:
          "image",

        transformation: [
          {
            width: 500,
            height: 500,
            crop: "fill",
            gravity: "face",
          },
        ],
      },
    );

  return result.secure_url;
};