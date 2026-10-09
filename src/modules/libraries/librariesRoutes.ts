import { canUploadBookFile } from "../bookFiles/middlewares/canUploadBookFile.js";

import { handleEbookUpload } from "../bookFiles/middlewares/handleEbookUpload.js";
import { addBookFileController, getBookFilesController, downloadBookFileController } from "../bookFiles/controllers/bookFilesController.js";
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
  getLibraryGoalController,
  getMyLibrariesController,
  removeLibraryMemberController,
  updateLibraryBookController,
  updateLibraryBookCoverController,
  updateLibraryController,
  updateLibraryGoalController,
  updateLibraryMemberRoleController,
} from "./controllers/librariesController.js";

import { getBookRecommendationsController } from "../recommendations/controllers/bookRecommendationsController.js";
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
   LIBRARY GOAL
========================= */

librariesRouter.get(
  "/:libraryId/goal",
  getLibraryGoalController,
);

librariesRouter.put(
  "/:libraryId/goal",
  updateLibraryGoalController,
);


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
 * Р’РµСЃСЊ effective catalog.
 */
librariesRouter.get(
  "/:libraryId/recommendations",
  getBookRecommendationsController,
);
librariesRouter.get("/:libraryId/books", getLibraryBooksController);

/*
 * РћРґРЅР° effective book.
 *
 * LibraryBook overrides
 * + UserBook
 */
librariesRouter.get("/:libraryId/books/:bookId", getLibraryBookController);

/*
 * Р”РѕРґР°РІР°РЅРЅСЏ РєРЅРёРіРё.
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

librariesRouter.get("/:libraryId/books/:bookId/files", getBookFilesController);

librariesRouter.post(
  "/:libraryId/books/:bookId/files",
  canUploadBookFile,
  handleEbookUpload,
  addBookFileController,
);

librariesRouter.get("/:libraryId/books/:bookId/files/:fileId/download", downloadBookFileController);

export default librariesRouter;

