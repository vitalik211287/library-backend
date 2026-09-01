import { Router } from "express";

import {
  addBookToLibraryController,
  addLibraryMemberController,
  createLibraryController,
  getLibraryBooksController,
  getMyLibrariesController,
} from "../controllers/librariesController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateBody.js";

import { createBookSchema } from "../schemas/booksSchema.js";

const librariesRouter = Router();

librariesRouter.use(authMiddleware);

librariesRouter.get("/", getMyLibrariesController);

librariesRouter.get("/:libraryId/books", getLibraryBooksController);

librariesRouter.post("/", createLibraryController);

librariesRouter.post("/:libraryId/members", addLibraryMemberController);

librariesRouter.post(
  "/:libraryId/books",
  validateBody(createBookSchema),
  addBookToLibraryController,
);

export default librariesRouter;
