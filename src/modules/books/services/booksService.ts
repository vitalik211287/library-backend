import { getAllBooks } from "../repositories/booksRepository.js";

export const getAllBooksService = async () => {
  const books = await getAllBooks();

  return books;
};
