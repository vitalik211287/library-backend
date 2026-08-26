import type { Request, Response } from "express";

import { registerService } from "../services/registerService.js";

export const registerController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { name, email, password } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (name !== undefined && typeof name !== "string") {
      return res.status(400).json({
        message: "Name must be a string",
      });
    }

    const result = await registerService({
      name,
      email,
      password,
    });

    return res.status(201).json({
      message: "User registered successfully",
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User already exists") {
        return res.status(409).json({
          message: error.message,
        });
      }

      if (error.message === "JWT_SECRET is not configured") {
        console.error(error.message);

        return res.status(500).json({
          message: "Server configuration error",
        });
      }

      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};