import { Router } from "express";

import { authMiddleware } from "../middlewares/authMiddleware.js";

import { getUserBookController } from "../controllers/getUserBookController.js";
import { updateUserBookController } from "../controllers/updateUserBookController.js";

import { startUserReadingController } from "../controllers/startUserReadingController.js";
import { finishUserReadingController } from "../controllers/finishUserReadingController.js";
import { getActiveUserReadingSessionController } from "../controllers/getActiveUserReadingSessionController.js";
import { getUserReadingStatsController } from "../controllers/getUserReadingStatsController.js";
import { pauseUserReadingController } from "../controllers/pauseUserReadingController.js";
import { resumeUserReadingController } from "../controllers/resumeUserReadingController.js";
import { importUserReadingController } from "../controllers/importUserReadingController.js";
import { getCurrentUserBookController } from "../controllers/getCurrentUserBookController.js";
import { getFinishedUserBooksController } from "../controllers/getFinishedUserBooksController.js";

const userBooksRouter = Router();

userBooksRouter.use(authMiddleware);
userBooksRouter.get("/current", getCurrentUserBookController);
userBooksRouter.get("/finished", getFinishedUserBooksController);
userBooksRouter.get("/:bookId", getUserBookController);

userBooksRouter.patch("/:bookId", updateUserBookController);

userBooksRouter.post("/:bookId/reading/start", startUserReadingController);

userBooksRouter.post("/:bookId/reading/finish", finishUserReadingController);
userBooksRouter.post("/:bookId/reading/import", importUserReadingController);

userBooksRouter.get(
  "/:bookId/reading/active",
  getActiveUserReadingSessionController,
);

userBooksRouter.get("/:bookId/reading/stats", getUserReadingStatsController);

userBooksRouter.post("/:bookId/reading/pause", pauseUserReadingController);

userBooksRouter.post("/:bookId/reading/resume", resumeUserReadingController);

export default userBooksRouter;
