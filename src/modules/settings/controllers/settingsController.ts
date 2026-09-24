import { GlobalTheme } from "@prisma/client";
import type { Request, Response } from "express";

import {
  getGlobalThemeService,
  updateGlobalThemeService,
} from "../services/settingsService.js";

export const getGlobalThemeController = async (
  _req: Request,
  res: Response,
) => {
  const globalTheme = await getGlobalThemeService();

  res.json({
    globalTheme,
  });
};

export const updateGlobalThemeController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { globalTheme } = req.body;

    if (
      typeof globalTheme !== "string" ||
      !Object.values(GlobalTheme).includes(globalTheme as GlobalTheme)
    ) {
      return res.status(400).json({
        message: "Invalid global theme",
      });
    }

    const updatedTheme = await updateGlobalThemeService(
      globalTheme as GlobalTheme,
    );

    return res.status(200).json({
      globalTheme: updatedTheme,
    });
  } catch (error) {
    console.error("Update global theme error:", error);

    return res.status(500).json({
      message: "Failed to update global theme",
    });
  }
};
