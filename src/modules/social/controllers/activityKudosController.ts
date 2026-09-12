import type { Request, Response } from "express";

import {
  addActivityKudosService,
  removeActivityKudosService,
  getActivityKudosUsersService,
} from "../services/activityKudosService.js";

export const addActivityKudosController = async (
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

    const { activityId } = req.params;

    if (typeof activityId !== "string") {
      return res.status(400).json({
        message: "Activity ID is required",
      });
    }

    const result = await addActivityKudosService(activityId, userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Add activity kudos error:", error);

    if (error instanceof Error) {
      const status =
        error.message === "Activity not found"
          ? 404
          : error.message === "You cannot give kudos to your own activity"
            ? 400
            : 500;

      return res.status(status).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to add kudos",
    });
  }
};

export const removeActivityKudosController = async (
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

    const { activityId } = req.params;

    if (typeof activityId !== "string") {
      return res.status(400).json({
        message: "Activity ID is required",
      });
    }

    const result = await removeActivityKudosService(activityId, userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Remove activity kudos error:", error);

    if (error instanceof Error && error.message === "Activity not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to remove kudos",
    });
  }
};


export const getActivityKudosUsersController = async (
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

    const { activityId } = req.params;

    if (typeof activityId !== "string") {
      return res.status(400).json({
        message: "Activity ID is required",
      });
    }

    const users = await getActivityKudosUsersService(activityId);

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get activity kudos users error:", error);

    if (error instanceof Error && error.message === "Activity not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to get kudos users",
    });
  }
};
