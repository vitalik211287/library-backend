import type { Request, Response } from "express";

import {
  addPostKudosService,
  removePostKudosService,
  getPostKudosUsersService,
} from "../services/postKudosService.js";

export const addPostKudosController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { postId } = req.params;

    if (typeof postId !== "string") {
      return res.status(400).json({ message: "Post ID is required" });
    }

    const result = await addPostKudosService(postId, userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Add post kudos error:", error);

    if (error instanceof Error) {
      const status =
        error.message === "Post not found"
          ? 404
          : error.message === "You cannot give kudos to your own post"
            ? 400
            : 500;

      return res.status(status).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to add kudos" });
  }
};

export const removePostKudosController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { postId } = req.params;

    if (typeof postId !== "string") {
      return res.status(400).json({ message: "Post ID is required" });
    }

    const result = await removePostKudosService(postId, userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Remove post kudos error:", error);

    if (error instanceof Error && error.message === "Post not found") {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to remove kudos" });
  }
};

export const getPostKudosUsersController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { postId } = req.params;

    if (typeof postId !== "string") {
      return res.status(400).json({ message: "Post ID is required" });
    }

    const users = await getPostKudosUsersService(postId);

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get post kudos users error:", error);

    if (error instanceof Error && error.message === "Post not found") {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to get kudos users" });
  }
};
