import { Router } from "express";

import { registerController } from "../controllers/registerController.js";
import { loginController } from "../controllers/loginController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const authRouter = Router();

authRouter.post("/register", registerController);

authRouter.post("/login", loginController);

authRouter.get(
  "/me",
  authMiddleware,
  (req, res) => {
    res.json({
      message: "Authorized",
      userId: res.locals.userId,
    });
  },
);

export default authRouter;