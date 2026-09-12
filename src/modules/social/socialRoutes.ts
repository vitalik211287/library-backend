import { Router } from "express";

import { authMiddleware } from "../../middlewares/authMiddleware.js";

import {
  addActivityKudosController,
  removeActivityKudosController,
  getActivityKudosUsersController,
} from "./controllers/activityKudosController.js";

const socialRouter = Router();

socialRouter.use(authMiddleware);

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
  getActivityKudosUsersController,
);

export default socialRouter;


