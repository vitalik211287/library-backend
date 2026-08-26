import { Router } from "express";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getReadingCalendarController } from "../controllers/getReadingCalendarController.js";

const readingRouter = Router();

readingRouter.use(authMiddleware);

readingRouter.get(
  "/calendar",
  getReadingCalendarController,
);

export default readingRouter;