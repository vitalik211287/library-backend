import {
  addActivityKudosService,
  removeActivityKudosService,
  getActivityKudosUsersService,
} from "../services/activityKudosService.js";

import { createKudosController } from "./createKudosController.js";

export const addActivityKudosController = createKudosController(
  "activity",
  "add",
  addActivityKudosService,
);

export const removeActivityKudosController = createKudosController(
  "activity",
  "remove",
  removeActivityKudosService,
);

export const getActivityKudosUsersController = createKudosController(
  "activity",
  "users",
  getActivityKudosUsersService,
);
