import { Router } from "express";

import {
  addLibraryMemberController,
  createLibraryController,
  getMyLibrariesController,
} from "../controllers/librariesController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const librariesRouter = Router();

librariesRouter.use(authMiddleware);

librariesRouter.get("/", getMyLibrariesController);

librariesRouter.post("/", createLibraryController);

librariesRouter.post("/:libraryId/members", addLibraryMemberController);

export default librariesRouter;
