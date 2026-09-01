import { Router } from "express";

import {
  addBookToLibraryController,
  addLibraryMemberController,
  createLibraryController,
  deleteLibraryController,
  getLibraryBooksController,
  getLibraryMembersController,
  getMyLibrariesController,
  removeLibraryMemberController,
  updateLibraryController,
  updateLibraryMemberRoleController,
} from "../controllers/librariesController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validateBody.js";

import { createBookSchema } from "../schemas/booksSchema.js";

const librariesRouter = Router();

librariesRouter.use(authMiddleware);

librariesRouter.get("/", getMyLibrariesController);

librariesRouter.post("/", createLibraryController);

librariesRouter.patch("/:libraryId", updateLibraryController);

librariesRouter.delete("/:libraryId", deleteLibraryController);

librariesRouter.get("/:libraryId/members", getLibraryMembersController);

librariesRouter.post("/:libraryId/members", addLibraryMemberController);

librariesRouter.patch(
  "/:libraryId/members/:memberUserId",
  updateLibraryMemberRoleController,
);

librariesRouter.delete(
  "/:libraryId/members/:memberUserId",
  removeLibraryMemberController,
);

librariesRouter.get("/:libraryId/books", getLibraryBooksController);

librariesRouter.post(
  "/:libraryId/books",
  validateBody(createBookSchema),
  addBookToLibraryController,
);

export default librariesRouter;
