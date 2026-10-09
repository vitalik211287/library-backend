import {
  addPostKudosService,
  removePostKudosService,
  getPostKudosUsersService,
} from "../services/postKudosService.js";

import { createKudosController } from "./createKudosController.js";

export const addPostKudosController = createKudosController(
  "post",
  "add",
  addPostKudosService,
);

export const removePostKudosController = createKudosController(
  "post",
  "remove",
  removePostKudosService,
);

export const getPostKudosUsersController = createKudosController(
  "post",
  "users",
  getPostKudosUsersService,
);
