import { getBookByIsbnService } from "../services/booksServiceIsbn.js";
import type { Request, Response } from "express";

export const getBookByIsbnController = async (
  req: Request<{ isbn: string }>,
  res: Response,
) => {
  const { isbn } = req.params;

  const book = await getBookByIsbnService(isbn);

  res.json(book);
};
