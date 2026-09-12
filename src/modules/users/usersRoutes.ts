import { Router } from "express";

import { authMiddleware } from "../../middlewares/authMiddleware.js";

import {
  followUserController,
  getFollowersController,
  getFollowingController,
  getUserFollowingController,
  getUserFollowersController,
  getPublicUserProfileController,
  getPublicUserAchievementsController,
  searchUsersController,
  unfollowUserController,
} from "./controllers/socialController.js";

const usersRouter = Router();

usersRouter.use(authMiddleware);

usersRouter.get("/search", searchUsersController);

usersRouter.get("/me/following", getFollowingController);

usersRouter.get("/me/followers", getFollowersController);

usersRouter.get("/:userId/following", getUserFollowingController);

usersRouter.get("/:userId/followers", getUserFollowersController);

usersRouter.get("/:userId/profile", getPublicUserProfileController);

usersRouter.get("/:userId/achievements", getPublicUserAchievementsController);

usersRouter.post("/:userId/follow", followUserController);

usersRouter.delete("/:userId/follow", unfollowUserController);

export default usersRouter;



