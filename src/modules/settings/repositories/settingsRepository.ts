import prisma from "../../../utils/prisma.js";
import { GlobalTheme } from "@prisma/client";

const APP_SETTINGS_ID = 1;

export const getAppSettings = async () => {
  return prisma.appSettings.upsert({
    where: {
      id: APP_SETTINGS_ID,
    },
    update: {},
    create: {
      id: APP_SETTINGS_ID,
    },
  });
};

export const updateGlobalTheme = async (globalTheme: GlobalTheme) => {
  return prisma.appSettings.upsert({
    where: {
      id: APP_SETTINGS_ID,
    },
    update: {
      globalTheme,
    },
    create: {
      id: APP_SETTINGS_ID,
      globalTheme,
    },
  });
};
