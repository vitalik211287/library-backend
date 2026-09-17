import type { Request, Response } from "express";

import {
  deleteNotificationsService,
  getNotificationsService,
  getUnreadNotificationsCountService,
  markAllNotificationsAsReadService,
  markNotificationAsReadService,
} from "../services/notificationsService.js";

export const getNotificationsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const notifications = await getNotificationsService(userId);

    return res.status(200).json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      message: "Failed to get notifications",
    });
  }
};

export const getUnreadNotificationsCountController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const count = await getUnreadNotificationsCountService(userId);

    return res.status(200).json({
      count,
    });
  } catch (error) {
    console.error("Get unread notifications count error:", error);

    return res.status(500).json({
      message: "Failed to get unread notifications count",
    });
  }
};

export const markNotificationAsReadController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { notificationId } = req.params;

    if (typeof notificationId !== "string") {
      return res.status(400).json({
        message: "Notification ID is required",
      });
    }

    await markNotificationAsReadService(notificationId, userId);

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    return res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
};

export const markAllNotificationsAsReadController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    await markAllNotificationsAsReadService(userId);

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);

    return res.status(500).json({
      message: "Failed to mark all notifications as read",
    });
  }
};

export const deleteNotificationsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { ids } = req.body;

    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      !ids.every((id) => typeof id === "string" && id.length > 0)
    ) {
      return res.status(400).json({
        message: "Notification IDs are required",
      });
    }

    const result = await deleteNotificationsService(ids, userId);

    return res.status(200).json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Delete notifications error:", error);

    return res.status(500).json({
      message: "Failed to delete notifications",
    });
  }
};
