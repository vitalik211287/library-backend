import { getBookFromVivat } from "../../../providers/vivatProvider.js";
import { getBookFromKnigoland } from "../../../providers/knigolandProvider.js";

export const getBookByIsbnService = async (isbn: string) => {
  try {
    const book = await getBookFromVivat(isbn);

    console.log("SOURCE: VIVAT", {
      isbn,
      coverUrl: book.coverUrl,
    });

    return book;
  } catch {
    console.log("Vivat не знайшов книгу, пробуємо Knigoland");

    const book = await getBookFromKnigoland(isbn);

    console.log("SOURCE: KNIGOLAND", {
      isbn,
      coverUrl: book.coverUrl,
    });

    return book;
  }
};

