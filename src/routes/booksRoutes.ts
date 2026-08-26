import { Router } from "express";

import { getAllBooksController } from "../controllers/booksController.js";
import { addBookController } from "../controllers/addBookController.js";
import { getBookByIsbnController } from "../controllers/booksControllerIsbn.js";
import { uploadCover } from "../middlewares/uploadCover.js";
import { uploadBookCoverController } from "../controllers/uploadBookCoverController.js";
import { updateBookController } from "../controllers/updateBookController.js";
import { updateBookSchema } from "../schemas/booksSchema.js";
import { validateBody } from "../middlewares/validateBody.js";
import { createBookSchema } from "../schemas/booksSchema.js";
import { startReadingController } from "../controllers/startReadingController.js";
import { finishReadingController } from "../controllers/finishReadingController.js";
import { getReadingStatsController } from "../controllers/getReadingStatsController.js";
import { updateBookRatingController } from "../controllers/updateBookRatingController.js";
import { getReadingCalendarController } from "../controllers/getReadingCalendarController.js";
import { getReadingHistoryController } from "../controllers/getReadingHistoryController.js";
import { getActiveReadingSessionController } from "../controllers/getActiveReadingSessionController.js";

const booksRouter = Router();

booksRouter.get("/", getAllBooksController);

booksRouter.get("/lookup/:isbn", getBookByIsbnController);

booksRouter.post("/", validateBody(createBookSchema), addBookController);
booksRouter.patch("/:id", validateBody(updateBookSchema), updateBookController);
booksRouter.post(
  "/:id/cover",
  uploadCover.single("cover"),
  uploadBookCoverController,
);
booksRouter.get("/reading/calendar", getReadingCalendarController);

booksRouter.post("/:id/reading/start", startReadingController);

booksRouter.post("/:id/reading/finish", finishReadingController);

booksRouter.get("/:id/reading/stats", getReadingStatsController);

booksRouter.get("/:id/reading/history", getReadingHistoryController);

booksRouter.patch("/:id/rating", updateBookRatingController);
booksRouter.get("/:id/reading/active", getActiveReadingSessionController);
export default booksRouter;
