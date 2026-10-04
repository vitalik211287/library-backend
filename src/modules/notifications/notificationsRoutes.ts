import { Router } from "express";

import { authMiddleware } from "../../middlewares/authMiddleware.js";

import {
  deleteNotificationsController,
  getNotificationsController,
  getUnreadNotificationsCountController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from "./controllers/notificationsController.js";

import {
  getPushPublicKeyController,
  subscribeToPushController,
  unsubscribeFromPushController,
} from "./controllers/pushSubscriptionController.js";

const notificationsRouter = Router();

notificationsRouter.get(
  "/push-public-key",
  getPushPublicKeyController,
);

notificationsRouter.use(authMiddleware);

notificationsRouter.get("/", getNotificationsController);

notificationsRouter.delete("/", deleteNotificationsController);

notificationsRouter.post(
  "/push-subscription",
  subscribeToPushController,
);

notificationsRouter.delete(
  "/push-subscription",
  unsubscribeFromPushController,
);

notificationsRouter.get("/unread-count", getUnreadNotificationsCountController);

notificationsRouter.patch("/read-all", markAllNotificationsAsReadController);

notificationsRouter.patch(
  "/:notificationId/read",
  markNotificationAsReadController,
);

export default notificationsRouter;
