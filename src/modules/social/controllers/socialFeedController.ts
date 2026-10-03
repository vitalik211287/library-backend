import type { Request, Response } from "express";

import { getSocialFeedService } from "../services/socialFeedService.js";

export const getSocialFeedController = async (
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

    const scope =
      req.query.scope === "following" ? "following" : "all";

    const requestedPage = Number(req.query.page);
    const requestedLimit = Number(req.query.limit);

    const page =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;

    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 50)
        : 20;

    const result = await getSocialFeedService(
      userId,
      limit,
      scope,
      page,
    );

    return res.status(200).json({
      count: result.activities.length,
      activities: result.activities,
      page: result.page,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error("Get social feed error:", error);

    return res.status(500).json({
      message: "Failed to get social feed",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
};