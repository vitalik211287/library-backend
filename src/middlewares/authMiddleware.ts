import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = {
  userId: string;
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    res.status(401).json({
      message: "Authorization token is required",
    });

    return;
  }

  const [type, token] = authorization.split(" ");

  if (type !== "Bearer" || !token) {
    res.status(401).json({
      message: "Invalid authorization format",
    });

    return;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    res.status(500).json({
      message: "JWT_SECRET is not configured",
    });

    return;
  }

  try {
    const payload = jwt.verify(
      token,
      jwtSecret,
    ) as JwtPayload;

    res.locals.userId = payload.userId;

    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
