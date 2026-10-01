import { getAllBooks } from "../repositories/booksRepository.js";

export const getAllBooksService = async (query?: string) => {
  const books = await getAllBooks(query);

  return books;
};
