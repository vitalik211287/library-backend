import type {
  Request,
  Response,
} from "express";

import {
  updateUserAvatarService,
  updateUserNameService,
  updateUserPasswordService,
} from "../services/updateProfileService.js";

export const updateUserNameController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId =
        res.locals.userId as string;

      const {
        name,
      } = req.body;

      if (
        typeof name !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Name is required",
          });
      }

      const user =
        await updateUserNameService(
          userId,
          name,
        );

      return res
        .status(200)
        .json({
          message:
            "Name updated successfully",
          user,
        });
    } catch (error) {
      if (
        error instanceof
        Error
      ) {
        return res
          .status(400)
          .json({
            message:
              error.message,
          });
      }

      return res
        .status(500)
        .json({
          message:
            "Internal server error",
        });
    }
  };

export const updateUserPasswordController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId =
        res.locals.userId as string;

      const {
        currentPassword,
        newPassword,
      } = req.body;

      if (
        typeof currentPassword !==
          "string" ||
        typeof newPassword !==
          "string"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Current and new password are required",
          });
      }

      await updateUserPasswordService(
        userId,
        currentPassword,
        newPassword,
      );

      return res
        .status(200)
        .json({
          message:
            "Password updated successfully",
        });
    } catch (error) {
      if (
        error instanceof
        Error
      ) {
        return res
          .status(400)
          .json({
            message:
              error.message,
          });
      }

      return res
        .status(500)
        .json({
          message:
            "Internal server error",
        });
    }
  };

export const updateUserAvatarController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId =
        res.locals.userId as string;

      if (!req.file) {
        return res
          .status(400)
          .json({
            message:
              "Avatar is required",
          });
      }

      const user =
        await updateUserAvatarService(
          userId,
          req.file.buffer,
        );

      return res
        .status(200)
        .json({
          message:
            "Avatar updated successfully",
          user,
        });
    } catch (error) {
      console.error(
        "Update avatar error:",
        error,
      );

      if (
        error instanceof
        Error
      ) {
        return res
          .status(400)
          .json({
            message:
              error.message,
          });
      }

      return res
        .status(500)
        .json({
          message:
            "Internal server error",
        });
    }
  };