import { Router } from "express";

import { getGlobalThemeController } from "./controllers/settingsController.js";

const settingsRouter = Router();

settingsRouter.get("/theme", getGlobalThemeController);

export default settingsRouter;
