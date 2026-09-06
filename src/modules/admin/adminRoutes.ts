import { Router } from "express";

import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { adminMiddleware } from "../../middlewares/adminMiddleware.js";

import {
  blockAdminUserController,
  getAdminUserByIdController,
  getAdminUsersController,
  unblockAdminUserController,
} from "./controllers/adminUsersController.js";

const adminRouter = Router();

adminRouter.use(authMiddleware);

adminRouter.use(adminMiddleware);

adminRouter.get("/users", getAdminUsersController);

adminRouter.get(
  "/users/:userId",
  getAdminUserByIdController,
);

adminRouter.patch(
  "/users/:userId/block",
  blockAdminUserController,
);

adminRouter.patch(
  "/users/:userId/unblock",
  unblockAdminUserController,
);

export default adminRouter;
