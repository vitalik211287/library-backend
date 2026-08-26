import { Router } from "express";

import { registerController } from "../controllers/registerController.js";
import { loginController } from "../controllers/loginController.js";
import { meController } from "../controllers/meController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const authRouter = Router();

authRouter.post("/register", registerController);

authRouter.post("/login", loginController);

authRouter.get(
  "/me",
  authMiddleware,
  meController,
);

export default authRouter;