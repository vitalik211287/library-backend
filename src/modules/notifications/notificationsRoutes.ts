import { Router } from "express";

import { authMiddleware } from "../../middlewares/authMiddleware.js";

import {
  deleteNotificationsController,
  getNotificationsController,
  getUnreadNotificationsCountController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from "./controllers/notificationsController.js";

const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

notificationsRouter.get("/", getNotificationsController);

notificationsRouter.delete("/", deleteNotificationsController);

notificationsRouter.get("/unread-count", getUnreadNotificationsCountController);

notificationsRouter.patch("/read-all", markAllNotificationsAsReadController);

notificationsRouter.patch(
  "/:notificationId/read",
  markNotificationAsReadController,
);

export default notificationsRouter;
