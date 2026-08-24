const LOCAL_API = "http://localhost:4000/api/books";

const CLOUD_API =
  "https://library-backend-production-5d60.up.railway.app/api/books";

const migrateBooks = async () => {
  const response = await fetch(LOCAL_API);

  if (!response.ok) {
    throw new Error("Не вдалося отримати локальні книги");
  }

  const books = await response.json();

  console.log(`Знайдено книг: ${books.length}`);

  for (const book of books) {
    const bookData = {
  isbn: book.isbn,
  title: book.title,
  author: book.author,

  ...(book.publisher != null && { publisher: book.publisher }),
  ...(book.year != null && { year: book.year }),
  ...(book.pages != null && { pages: book.pages }),
  ...(book.genre != null && { genre: book.genre }),
  ...(book.language != null && { language: book.language }),
  ...(book.description != null && { description: book.description }),
};

    const cloudResponse = await fetch(CLOUD_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookData),
    });

    const result = await cloudResponse.json();

    if (!cloudResponse.ok) {
      console.log(`❌ ${book.title}`);
      console.log(result);
      continue;
    }

    console.log(`✅ ${book.title}`);
  }

  console.log("Перенесення завершено");
};

migrateBooks().catch((error) => {
  console.error("Помилка міграції:", error);
});