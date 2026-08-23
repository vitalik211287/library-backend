import type { Request, Response } from "express";
import { getBookByIsbnService } from "../services/booksService.js";

export const getBookByIsbnController = async (
  req: Request<{ isbn: string }>,
  res: Response
) => {
  const { isbn } = req.params;

  const book = await getBookByIsbnService(isbn);

  res.json(book);
};