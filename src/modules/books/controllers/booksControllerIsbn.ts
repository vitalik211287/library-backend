import type { Request, Response } from "express";
import { lookupBookByIsbnService } from "../services/lookupBookByIsbnService.js";
export const getBookByIsbnController = async (
  req: Request<{ isbn: string }>,
  res: Response,
) => {
  try {
    const { isbn } = req.params;

    const book = await lookupBookByIsbnService(isbn);

    return res.json(book);
  } catch (error) {
    console.error("Помилка пошуку книги:", error);

    return res.status(404).json({
      message: "Книгу з таким ISBN не знайдено",
    });
  }
};