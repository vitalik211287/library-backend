import type { Request, Response } from "express";
import { updateBookService } from "../services/updateBookService.js";

export const updateBookController = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const book = await updateBookService(
      id,
      req.body,
    );

    res.json(book);
  } catch (error) {
    console.error(
      "Помилка редагування книги:",
      error,
    );

    res.status(500).json({
      message: "Не вдалося оновити книгу",
    });
  }
};