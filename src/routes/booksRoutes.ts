import { Router } from "express";

import { getAllBooksController } from "../controllers/booksController.js";
import { addBookController } from "../controllers/addBookController.js";
import { getBookByIsbnController } from "../controllers/booksControllerIsbn.js";
import { uploadBookCoverController } from "../controllers/uploadBookCoverController.js";
import { updateBookController } from "../controllers/updateBookController.js";
import { getReadingCalendarController } from "../controllers/getReadingCalendarController.js";

import { uploadCover } from "../middlewares/uploadCover.js";
import { validateBody } from "../middlewares/validateBody.js";

import {
  createBookSchema,
  updateBookSchema,
} from "../schemas/booksSchema.js";

const booksRouter = Router();

/*
 * Отримати всі книги
 */
booksRouter.get(
  "/",
  getAllBooksController,
);

/*
 * Знайти книгу за ISBN
 */
booksRouter.get(
  "/lookup/:isbn",
  getBookByIsbnController,
);

/*
 * Додати книгу
 */
booksRouter.post(
  "/",
  validateBody(createBookSchema),
  addBookController,
);

/*
 * Календар читання
 */
booksRouter.get(
  "/reading/calendar",
  getReadingCalendarController,
);

/*
 * Редагувати книгу
 */
booksRouter.patch(
  "/:id",
  validateBody(updateBookSchema),
  updateBookController,
);

/*
 * Завантажити обкладинку
 */
booksRouter.post(
  "/:id/cover",
  uploadCover.single("cover"),
  uploadBookCoverController,
);

export default booksRouter;