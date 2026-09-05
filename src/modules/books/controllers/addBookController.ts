import type { Request, Response } from "express";
import { addBookService } from "../services/addBookService.js";

export const addBookController = async (
  req: Request,
  res: Response,
) => {
  try {
    const book = await addBookService(req.body);

    res.status(201).json(book);
  } catch (error) {
    if (
      error instanceof Error &&
      "statusCode" in error
    ) {
      const statusCode = (
        error as Error & { statusCode: number }
      ).statusCode;

      return res.status(statusCode).json({
        message: error.message,
      });
    }

    console.error("Помилка додавання книги:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};