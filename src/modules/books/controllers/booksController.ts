import type { Request, Response } from "express";

import { getAllBooksService } from "../services/booksService.js";

export const getAllBooksController = async (req: Request, res: Response) => {
  const query = typeof req.query.q === "string" ? req.query.q : undefined;

  const books = await getAllBooksService(query);

  res.json(books);
};
