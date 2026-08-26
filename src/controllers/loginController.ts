import type { Request, Response } from "express";

import { loginService } from "../services/loginService.js";

export const loginController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required",
      });

      return;
    }

    const result = await loginService({
      email,
      password,
    });

    res.status(200).json({
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Login failed";

    res.status(401).json({
      message,
    });
  }
};
