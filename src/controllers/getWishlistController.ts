import type {
  Request,
  Response,
} from "express";

import { getWishlistService } from "../services/wishlistService.js";

export const getWishlistController = async (
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

    const result =
      await getWishlistService(userId);

    return res
      .status(200)
      .json(result);
  } catch (error) {
    console.error(
      "Get wishlist error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to get wishlist",
    });
  }
};