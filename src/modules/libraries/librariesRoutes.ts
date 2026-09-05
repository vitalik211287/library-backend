import type { NextFunction, Request, Response } from "express";

import { Router } from "express";

import {
  addBookToLibraryController,
  addLibraryMemberController,
  createLibraryController,
  deleteLibraryController,
  getLibraryBookController,
  getLibraryBooksController,
  getLibraryMembersController,
  getMyLibrariesController,
  removeLibraryMemberController,
  updateLibraryBookController,
  updateLibraryBookCoverController,
  updateLibraryController,
  updateLibraryMemberRoleController,
} from "./controllers/librariesController.js";

import { authMiddleware } from "../../middlewares/authMiddleware.js";

import { uploadCover } from "../../middlewares/uploadCover.js";

import { validateBody } from "../../middlewares/validateBody.js";

import { createBookSchema, updateBookSchema } from "../../schemas/booksSchema.js";

const librariesRouter = Router();

const normalizeCreateBookBody = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (typeof req.body.year === "string") {
    const year = req.body.year.trim();

    if (year) {
      req.body.year = Number(year);
    } else {
      delete req.body.year;
    }
  }

  if (typeof req.body.pages === "string") {
    const pages = req.body.pages.trim();

    if (pages) {
      req.body.pages = Number(pages);
    } else {
      delete req.body.pages;
    }
  }

  next();
};

librariesRouter.use(authMiddleware);

/* =========================
   LIBRARIES
========================= */

librariesRouter.get("/", getMyLibrariesController);

librariesRouter.post("/", createLibraryController);

librariesRouter.patch("/:libraryId", updateLibraryController);

librariesRouter.delete("/:libraryId", deleteLibraryController);

/* =========================
   MEMBERS
========================= */

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

/* =========================
   BOOKS
========================= */

/*
 * Весь effective catalog.
 */
librariesRouter.get("/:libraryId/books", getLibraryBooksController);

/*
 * Одна effective book.
 *
 * LibraryBook overrides
 * + UserBook
 */
librariesRouter.get("/:libraryId/books/:bookId", getLibraryBookController);

/*
 * Додавання книги.
 */
librariesRouter.post(
  "/:libraryId/books",
  uploadCover.single("cover"),
  normalizeCreateBookBody,
  validateBody(createBookSchema),
  addBookToLibraryController,
);

/* =========================
   UPDATE BOOK
========================= */

librariesRouter.patch(
  "/:libraryId/books/:bookId",
  validateBody(updateBookSchema),
  updateLibraryBookController,
);

/* =========================
   UPDATE BOOK COVER
========================= */

librariesRouter.post(
  "/:libraryId/books/:bookId/cover",
  uploadCover.single("cover"),
  updateLibraryBookCoverController,
);

export default librariesRouter;

