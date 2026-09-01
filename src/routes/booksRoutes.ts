import { Router } from "express";

import { getAllBooksController } from "../controllers/booksController.js";
import { getBookByIsbnController } from "../controllers/booksControllerIsbn.js";

const booksRouter = Router();

booksRouter.get("/", getAllBooksController);

booksRouter.get("/lookup/:isbn", getBookByIsbnController);

export default booksRouter;
