import { Router } from "express";

import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { getSocialFeedController } from "./controllers/socialFeedController.js";

import {
  addActivityKudosController,
  removeActivityKudosController,
  getActivityKudosUsersController,
} from "./controllers/activityKudosController.js";

const socialRouter = Router();

socialRouter.use(authMiddleware);

socialRouter.get("/feed", getSocialFeedController);

socialRouter.get(
  "/activities/:activityId/kudos",
  getActivityKudosUsersController,
);
socialRouter.post(
  "/activities/:activityId/kudos",
  addActivityKudosController,
);

socialRouter.delete(
  "/activities/:activityId/kudos",
  removeActivityKudosController,
);

export default socialRouter;


