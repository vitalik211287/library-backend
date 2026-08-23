import type { Request, Response } from "express";
import { getAllBooksService } from "../services/booksService.js";

export const getAllBooksController = async (
  req: Request,
  res: Response
) => {
  const books = await getAllBooksService();

  res.json(books);
};