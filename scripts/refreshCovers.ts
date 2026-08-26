const API =
  "https://library-backend-production-5d60.up.railway.app/api/books";

type Book = {
  id: string;
  isbn: string;
  title: string;
  coverUrl: string | null;
};

const ISBN_TO_REFRESH = [


  "9789661407915",
];

const refreshCovers = async () => {
  console.log("START refreshCovers");

  const booksResponse = await fetch(API);

  if (!booksResponse.ok) {
    throw new Error("Не вдалося отримати книги");
  }

  const books = (await booksResponse.json()) as Book[];

  for (const book of books) {
    if (!ISBN_TO_REFRESH.includes(book.isbn)) {
      continue;
    }

    try {
      console.log(`🔎 Шукаємо правильну обкладинку: ${book.title}`);

      // 1. Заново шукаємо книгу через Vivat / Knigoland
      const lookupResponse = await fetch(
        `${API}/lookup/${book.isbn}`,
      );

      if (!lookupResponse.ok) {
        console.log(`❌ ${book.title}: lookup не спрацював`);
        continue;
      }

      const foundBook = await lookupResponse.json();

      console.log("Знайдена обкладинка:", foundBook.coverUrl);

      if (!foundBook.coverUrl) {
        console.log(`❌ ${book.title}: обкладинку не знайдено`);
        continue;
      }

      // 2. Завантажуємо правильну картинку
      const imageResponse = await fetch(foundBook.coverUrl);

      if (!imageResponse.ok) {
        console.log(
          `❌ ${book.title}: не вдалося завантажити картинку`,
        );
        continue;
      }

      const blob = await imageResponse.blob();

      // 3. Відправляємо її у наш Cloudinary endpoint
      const formData = new FormData();

      formData.append(
        "cover",
        blob,
        `${book.isbn}.jpg`,
      );

      const uploadResponse = await fetch(
        `${API}/${book.id}/cover`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await uploadResponse.json();

      if (!uploadResponse.ok) {
        console.log(`❌ ${book.title}:`, result);
        continue;
      }

      console.log(`✅ ${book.title} оновлено`);
      console.log("Новий URL:", result.coverUrl);
    } catch (error) {
      console.log(`❌ ${book.title}:`, error);
    }
  }

  console.log("Оновлення завершено");
};

refreshCovers().catch(console.error);