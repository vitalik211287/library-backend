import type {
  Request,
  Response,
} from "express";

import {
  getAdminUserByIdService,
  getAdminUsersService,
  updateAdminUserBlockedStatusService,
} from "../services/adminUsersService.js";

export const getAdminUsersController = async (
  _req: Request,
  res: Response,
) => {
  try {
    const users = await getAdminUsersService();

    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.error(
      "Get admin users error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to get users",
    });
  }
};

export const getAdminUserByIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req.params;

    if (typeof userId !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const user =
      await getAdminUserByIdService(userId);

    return res.status(200).json({
      user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "USER_NOT_FOUND"
    ) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    console.error(
      "Get admin user error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to get user",
    });
  }
};

export const blockAdminUserController = async (
  req: Request,
  res: Response,
) => {
  try {
    const adminUserId = req.userId;
    const { userId } = req.params;

    if (!adminUserId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (typeof userId !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const user =
      await updateAdminUserBlockedStatusService(
        adminUserId,
        userId,
        true,
      );

    return res.status(200).json({
      message: "User blocked successfully",
      user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "CANNOT_BLOCK_SELF"
    ) {
      return res.status(400).json({
        message: "You cannot block your own account",
      });
    }

    if (
      error instanceof Error &&
      error.message === "USER_NOT_FOUND"
    ) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    console.error(
      "Block admin user error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to block user",
    });
  }
};

export const unblockAdminUserController = async (
  req: Request,
  res: Response,
) => {
  try {
    const adminUserId = req.userId;
    const { userId } = req.params;

    if (!adminUserId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (typeof userId !== "string") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const user =
      await updateAdminUserBlockedStatusService(
        adminUserId,
        userId,
        false,
      );

    return res.status(200).json({
      message: "User unblocked successfully",
      user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "USER_NOT_FOUND"
    ) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    console.error(
      "Unblock admin user error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to unblock user",
    });
  }
};
