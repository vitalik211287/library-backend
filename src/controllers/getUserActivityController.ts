import type {
  Request,
  Response,
} from "express";

import {
  getUserActivityService,
} from "../services/getUserActivityService.js";

export const getUserActivityController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId =
        req.userId;

      if (!userId) {
        return res
          .status(401)
          .json({
            message:
              "Unauthorized",
          });
      }

      const currentDate =
        new Date();

      const defaultYear =
        currentDate
          .getUTCFullYear();

      const defaultMonth =
        currentDate
          .getUTCMonth() +
        1;

      const year =
        Number(
          req.query.year,
        ) || defaultYear;

      const month =
        Number(
          req.query.month,
        ) || defaultMonth;

      if (
        month < 1 ||
        month > 12
      ) {
        return res
          .status(400)
          .json({
            message:
              "Month must be between 1 and 12",
          });
      }

      const activity =
        await getUserActivityService(
          userId,
          year,
          month,
        );

      return res
        .status(200)
        .json({
          activity,
        });
    } catch (error) {
      console.error(
        "Get user activity error:",
        error,
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to get user activity",
        });
    }
  };