import { Router } from "express";

import { authMiddleware } from "../../../middlewares/authMiddleware.js";

import { getUserBookController } from "../controllers/getUserBookController.js";
import { updateUserBookController } from "../controllers/updateUserBookController.js";

import { startUserReadingController } from "../../reading/controllers/startUserReadingController.js";
import { finishUserReadingController } from "../../reading/controllers/finishUserReadingController.js";
import { getActiveUserReadingSessionController } from "../../reading/controllers/getActiveUserReadingSessionController.js";
import { getUserReadingStatsController } from "../../reading/controllers/getUserReadingStatsController.js";
import { pauseUserReadingController } from "../../reading/controllers/pauseUserReadingController.js";
import { resumeUserReadingController } from "../../reading/controllers/resumeUserReadingController.js";
import { importUserReadingController } from "../../reading/controllers/importUserReadingController.js";

import { getUserReadingSessionsController } from "../../reading/controllers/getUserReadingSessionsController.js";
import { updateUserReadingSessionController } from "../../reading/controllers/updateUserReadingSessionController.js";
import { deleteUserReadingSessionController } from "../../reading/controllers/deleteUserReadingSessionController.js";

import { getCurrentUserBookController } from "../controllers/getCurrentUserBookController.js";
import { getFinishedUserBooksController } from "../controllers/getFinishedUserBooksController.js";

import { getWishlistController } from "../controllers/getWishlistController.js";
import { addToWishlistController } from "../controllers/addToWishlistController.js";
import { removeFromWishlistController } from "../controllers/removeFromWishlistController.js";

import { getUserStatsController } from "../../stats/controllers/getUserStatsController.js";
import { getUserActivityController } from "../../stats/controllers/getUserActivityController.js";

import { getReadingGoalController } from "../../stats/controllers/getReadingGoalController.js";
import { updateReadingGoalController } from "../../stats/controllers/updateReadingGoalController.js";

import { getUserAchievementsController } from "../../stats/controllers/getUserAchievementsController.js";

const userBooksRouter = Router();

userBooksRouter.use(authMiddleware);

/* =========================
   COLLECTION ROUTES
========================= */

userBooksRouter.get("/current", getCurrentUserBookController);

userBooksRouter.get("/finished", getFinishedUserBooksController);

userBooksRouter.get("/wishlist", getWishlistController);

userBooksRouter.get("/stats", getUserStatsController);

userBooksRouter.get("/activity", getUserActivityController);

userBooksRouter.get("/goals", getReadingGoalController);

userBooksRouter.put("/goals", updateReadingGoalController);

userBooksRouter.get("/achievements", getUserAchievementsController);

/* =========================
   SINGLE BOOK
========================= */

userBooksRouter.get("/:bookId", getUserBookController);

userBooksRouter.patch("/:bookId", updateUserBookController);

/* =========================
   WISHLIST
========================= */

userBooksRouter.post("/:bookId/wishlist", addToWishlistController);

userBooksRouter.delete("/:bookId/wishlist", removeFromWishlistController);

/* =========================
   READING
========================= */

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

/* =========================
   READING SESSION HISTORY
========================= */

userBooksRouter.get(
  "/:bookId/reading/sessions",
  getUserReadingSessionsController,
);

userBooksRouter.patch(
  "/:bookId/reading/sessions/:sessionId",
  updateUserReadingSessionController,
);

userBooksRouter.delete(
  "/:bookId/reading/sessions/:sessionId",
  deleteUserReadingSessionController,
);

export default userBooksRouter;


