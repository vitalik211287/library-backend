import type {
  Request,
  Response,
} from "express";

import { addToWishlistService } from "../services/wishlistService.js";

export const addToWishlistController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId = req.userId;
      const { bookId } = req.params;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      if (
        typeof bookId !== "string" ||
        !bookId
      ) {
        return res.status(400).json({
          message:
            "Book ID is required",
        });
      }

      const result =
        await addToWishlistService(
          userId,
          bookId,
        );

      return res
        .status(200)
        .json(result);
    } catch (error) {
      console.error(
        "Add to wishlist error:",
        error,
      );

      if (
        error instanceof Error &&
        error.message ===
          "BOOK_NOT_FOUND"
      ) {
        return res.status(404).json({
          message:
            "Book not found",
        });
      }

      return res.status(500).json({
        message:
          "Failed to add book to wishlist",
      });
    }
  };