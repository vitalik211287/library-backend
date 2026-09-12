import { Router } from "express";

import { authMiddleware } from "../../middlewares/authMiddleware.js";

import {
  getNotificationsController,
  getUnreadNotificationsCountController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from "./controllers/notificationsController.js";

const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

notificationsRouter.get("/", getNotificationsController);

notificationsRouter.get(
  "/unread-count",
  getUnreadNotificationsCountController,
);

notificationsRouter.patch(
  "/read-all",
  markAllNotificationsAsReadController,
);

notificationsRouter.patch(
  "/:notificationId/read",
  markNotificationAsReadController,
);

export default notificationsRouter;
