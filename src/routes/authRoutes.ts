import { Router } from "express";

import multer from "multer";

import { registerController } from "../controllers/registerController.js";
import { loginController } from "../controllers/loginController.js";
import { meController } from "../controllers/meController.js";

import {
  updateUserAvatarController,
  updateUserNameController,
  updateUserPasswordController,
} from "../controllers/updateProfileController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const authRouter = Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 15 * 1024 * 1024,
  },

  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image files are allowed"));

      return;
    }

    callback(null, true);
  },
});

authRouter.post("/register", registerController);

authRouter.post("/login", loginController);

authRouter.get("/me", authMiddleware, meController);

authRouter.patch("/me/name", authMiddleware, updateUserNameController);

authRouter.patch("/me/password", authMiddleware, updateUserPasswordController);

authRouter.patch(
  "/me/avatar",
  authMiddleware,
  avatarUpload.single("avatar"),
  updateUserAvatarController,
);

export default authRouter;
