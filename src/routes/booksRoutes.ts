import { Router } from "express";

import { getAllBooksController } from "../controllers/booksController.js";
import { addBookController } from "../controllers/addBookController.js";
import { getBookByIsbnController } from "../controllers/booksControllerIsbn.js";
import { uploadCover } from "../middlewares/uploadCover.js";
import { uploadBookCoverController } from "../controllers/uploadBookCoverController.js";

import { validateBody } from "../middlewares/validateBody.js";
import { createBookSchema } from "../schemas/booksSchema.js";

const booksRouter = Router();

booksRouter.get("/", getAllBooksController);

booksRouter.get("/lookup/:isbn", getBookByIsbnController);

booksRouter.post("/", validateBody(createBookSchema), addBookController);

booksRouter.post(
  "/:id/cover",
  uploadCover.single("cover"),
  uploadBookCoverController,
);

export default booksRouter;
