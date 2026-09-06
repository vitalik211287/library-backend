import type {
  NextFunction,
  Request,
  Response,
} from "express";

import prisma from "../utils/prisma.js";

export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        role: true,
        isBlocked: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Account is blocked",
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error(
      "Admin middleware error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to verify admin access",
    });
  }
};
