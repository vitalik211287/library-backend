import type { Request, Response } from "express";

import {
  addToWishlistService,
  removeFromWishlistService,
} from "../services/wishlistService.js";

type WishlistAction = "add" | "remove";

const createWishlistController = (action: WishlistAction) => {
  const service =
    action === "add" ? addToWishlistService : removeFromWishlistService;

  return async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      const { bookId } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (typeof bookId !== "string" || !bookId) {
        return res.status(400).json({ message: "Book ID is required" });
      }

      const result = await service(userId, bookId);

      return res.status(200).json(result);
    } catch (error) {
      console.error(
        (action === "add" ? "Add to" : "Remove from") + " wishlist error:",
        error,
      );

      if (
        error instanceof Error &&
        error.message === "BOOK_NOT_FOUND"
      ) {
        return res.status(404).json({ message: "Book not found" });
      }

      return res.status(500).json({
        message:
          action === "add"
            ? "Failed to add book to wishlist"
            : "Failed to remove book from wishlist",
      });
    }
  };
};

export const addToWishlistController =
  createWishlistController("add");

export const removeFromWishlistController =
  createWishlistController("remove");
