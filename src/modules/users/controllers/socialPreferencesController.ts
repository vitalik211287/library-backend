import type { Request, Response } from "express";

import {
  getSocialPreferenceService,
  updateSocialPreferenceService,
} from "../services/socialPreferencesService.js";

export const getSocialPreferenceController = async (
  req: Request,
  res: Response,
) => {
  try {
    const currentUserId = req.userId;
    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (typeof userId !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const result = await getSocialPreferenceService(
      currentUserId,
      userId,
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to get social preference",
    });
  }
};

export const updateSocialPreferenceController = async (
  req: Request,
  res: Response,
) => {
  try {
    const currentUserId = req.userId;
    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (typeof userId !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (typeof req.body?.muteNotifications !== "boolean") {
      return res.status(400).json({
        message: "muteNotifications must be boolean",
      });
    }

    const result = await updateSocialPreferenceService(
      currentUserId,
      userId,
      req.body.muteNotifications,
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to update social preference",
    });
  }
};