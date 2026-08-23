import type { Request, Response } from "express";
import { addBookService } from "../services/addBookService.js";

export const addBookController = async (
  req: Request,
  res: Response
) => {
  const book = await addBookService(req.body);

  res.status(201).json(book);
};