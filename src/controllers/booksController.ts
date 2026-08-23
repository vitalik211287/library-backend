import type { Request, Response } from "express";
import { getAllBooksService,lookupBookByIsbnService  } from "../services/booksService.js";

export const getAllBooksController = async (
  req: Request,
  res: Response
) => {
  const books = await getAllBooksService();

  res.json(books);
};

export const lookupBookByIsbnController = async (
  req: Request<{ isbn: string }>,
  res: Response
) => {
  const { isbn } = req.params;

  const book = await lookupBookByIsbnService(isbn);

  res.json(book);
};