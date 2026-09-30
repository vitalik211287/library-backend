import type { Request, Response } from "express";

import {
  createSocialPostService,
  getSocialPostThreadService,
} from "../services/socialPostService.js";
export const createSocialPostController = async (
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

    const { text, bookId, parentId } = req.body;

    const post = await createSocialPostService({
      authorId: userId,
      text,
      bookId,
      parentId,
    });

    return res.status(201).json(post);
  } catch (error) {
    console.error("Create social post error:", error);

    if (error instanceof Error) {
      const status =
        error.message === "Книгу не знайдено" ||
        error.message === "Батьківський допис не знайдено"
          ? 404
          : error.message === "Текст допису не може бути порожнім" ||
              error.message.startsWith("Текст допису не може перевищувати")
            ? 400
            : 500;

      return res.status(status).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create social post",
    });
  }
};

export const getSocialPostThreadController = async (
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

    const { postId } = req.params;

    if (typeof postId !== "string") {
      return res.status(400).json({
        message: "Post ID is required",
      });
    }

    const post = await getSocialPostThreadService(postId);

    return res.status(200).json(post);
  } catch (error) {
    console.error("Get social post thread error:", error);

    if (error instanceof Error && error.message === "Допис не знайдено") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to get social post thread",
    });
  }
};
