import { Router } from "express";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getUserBookController } from "../controllers/getUserBookController.js";

const userBooksRouter = Router();

userBooksRouter.get(
  "/:bookId",
  authMiddleware,
  getUserBookController,
);

export default userBooksRouter;