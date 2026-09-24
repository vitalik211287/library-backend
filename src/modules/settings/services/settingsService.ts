import { GlobalTheme } from "@prisma/client";

import {
  getAppSettings,
  updateGlobalTheme,
} from "../repositories/settingsRepository.js";

export const getGlobalThemeService = async () => {
  const settings = await getAppSettings();

  return settings.globalTheme;
};

export const updateGlobalThemeService = async (globalTheme: GlobalTheme) => {
  const settings = await updateGlobalTheme(globalTheme);

  return settings.globalTheme;
};
