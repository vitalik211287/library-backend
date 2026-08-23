import { Router } from "express";
import { getAllBooksController } from "../controllers/booksController.js";
import { addBookController } from "../controllers/addBookController.js";
import { validateBody } from "../middlewares/validateBody.js";
import { createBookSchema } from "../schemas/booksSchema.js";
import { getBookByIsbnController } from "../controllers/booksControllerIsbn.js";

const booksRouter = Router();

booksRouter.get("/", getAllBooksController);
booksRouter.get("/lookup/:isbn", getBookByIsbnController);
booksRouter.post("/", validateBody(createBookSchema), addBookController);
booksRouter.get("/test", (req, res) => {
  res.json({ message: "books router works" });
});

export default booksRouter;
