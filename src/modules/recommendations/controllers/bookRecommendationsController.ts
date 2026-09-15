import type { Request, Response } from "express";

import { getBookRecommendationsService } from "../services/bookRecommendationsService.js";

export const getBookRecommendationsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;
    const libraryIdParam = req.params.libraryId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!libraryIdParam || Array.isArray(libraryIdParam)) {
      return res.status(400).json({
        message: "Library id is required",
      });
    }

    const libraryId = libraryIdParam;

    const tagsParam = req.query.tags;

    const tags =
      typeof tagsParam === "string"
        ? tagsParam
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

    if (tags.length === 0) {
      return res.status(400).json({
        message: "At least one recommendation tag is required",
      });
    }

    const limitParam = req.query.limit;

    const parsedLimit =
      typeof limitParam === "string" ? Number.parseInt(limitParam, 10) : 10;

    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 50)
      : 10;

    const recommendations = await getBookRecommendationsService(
      userId,
      libraryId,
      tags,
      limit,
    );

    return res.status(200).json({
      recommendations,
    });
  } catch (error) {
    console.error("Get book recommendations error:", error);

    return res.status(500).json({
      message: "Failed to get book recommendations",
    });
  }
};
