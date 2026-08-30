import { Router } from "express";

import { authMiddleware } from "../middlewares/authMiddleware.js";

import {
  followUserController,
  getFollowersController,
  getFollowingController,
  getPublicUserProfileController,
  searchUsersController,
  unfollowUserController,
} from "../controllers/socialController.js";

const usersRouter = Router();

usersRouter.use(authMiddleware);

usersRouter.get("/search", searchUsersController);

usersRouter.get("/me/following", getFollowingController);

usersRouter.get("/me/followers", getFollowersController);

usersRouter.get("/:userId/profile", getPublicUserProfileController);

usersRouter.post("/:userId/follow", followUserController);

usersRouter.delete("/:userId/follow", unfollowUserController);

export default usersRouter;

