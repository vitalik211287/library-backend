/// <reference types="node" />

import { readFile } from "node:fs/promises";
import path from "node:path";

const LOCAL_API = "http://localhost:4000/api/books";

const CLOUD_API =
  "https://library-backend-production-5d60.up.railway.app/api/books";

const migrateCovers = async () => {
  const localResponse = await fetch(LOCAL_API);
  const localBooks = await localResponse.json();

  const cloudResponse = await fetch(CLOUD_API);
  const cloudBooks = await cloudResponse.json();

  for (const localBook of localBooks) {
    if (!localBook.coverUrl?.startsWith("/uploads/covers/")) {
      console.log(`⏭ ${localBook.title}: локальної обкладинки немає`);
      continue;
    }

    const cloudBook = cloudBooks.find(
      (book: { isbn: string }) => book.isbn === localBook.isbn,
    );

    if (!cloudBook) {
      console.log(`❌ ${localBook.title}: немає в Railway`);
      continue;
    }

    const filename = path.basename(localBook.coverUrl);

    const filePath = path.resolve(
      "uploads",
      "covers",
      filename,
    );

    try {
      const buffer = await readFile(filePath);

      const blob = new Blob([buffer], {
        type: filename.endsWith(".png")
          ? "image/png"
          : filename.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg",
      });

      const formData = new FormData();

      formData.append("cover", blob, filename);

      const response = await fetch(
        `${CLOUD_API}/${cloudBook.id}/cover`,
        {
          method: "POST",
          body: formData,
        },
      );

      const text = await response.text();

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        console.log(`❌ ${localBook.title}: сервер повернув не JSON`);
        console.log(text);
        continue;
      }

      if (!response.ok) {
        console.log(`❌ ${localBook.title}`, result);
        continue;
      }

      console.log(`✅ ${localBook.title}`);
      console.log(result.coverUrl);
    } catch (error) {
      console.log(`❌ ${localBook.title}:`, error);
    }
  }

  console.log("Перенесення обкладинок завершено");
};

migrateCovers().catch(console.error);