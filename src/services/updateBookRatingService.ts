import {
  getBookById,
  updateBookRating,
} from "../repositories/readingRepository.js";

export const updateBookRatingService = async (
  bookId: string,
  rating: number,
) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  return updateBookRating(bookId, rating);
};