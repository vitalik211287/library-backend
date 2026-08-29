import type {
  Request,
  Response,
} from "express";

import {
  getUserById,
} from "../repositories/usersRepository.js";

export const meController = async (
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

    const user =
      await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to get current user",
    });
  }
};