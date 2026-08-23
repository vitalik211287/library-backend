import fs from "node:fs/promises";
import path from "node:path";

export const saveBookCover = async (
  coverUrl: string,
  isbn: string
) => {
  const response = await fetch(coverUrl);

  if (!response.ok) {
    throw new Error("Failed to download book cover");
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());

  const coversDir = path.resolve("uploads", "covers");

  await fs.mkdir(coversDir, { recursive: true });

  const fileName = `${isbn}.jpg`;
  const filePath = path.join(coversDir, fileName);

  await fs.writeFile(filePath, imageBuffer);

  return `/uploads/covers/${fileName}`;
};