import {
  upsertReadingGoal,
  type ReadingGoalData,
} from "../repositories/readingGoalRepository.js";

import { getReadingGoalService } from "./getReadingGoalService.js";

type UpdateReadingGoalData = {
  booksGoal?: number | null;
  pagesGoal?: number | null;
  minutesGoal?: number | null;
};

const validateGoalValue = (value: unknown, fieldName: string) => {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }
};

export const updateReadingGoalService = async (
  userId: string,
  year: number,
  data: UpdateReadingGoalData,
) => {
  validateGoalValue(data.booksGoal, "booksGoal");

  validateGoalValue(data.pagesGoal, "pagesGoal");

  validateGoalValue(data.minutesGoal, "minutesGoal");

  const updateData: ReadingGoalData = {};

  if (data.booksGoal !== undefined) {
    updateData.booksGoal = data.booksGoal;
  }

  if (data.pagesGoal !== undefined) {
    updateData.pagesGoal = data.pagesGoal;
  }

  if (data.minutesGoal !== undefined) {
    updateData.minutesGoal = data.minutesGoal;
  }

  await upsertReadingGoal(userId, year, updateData);

  return getReadingGoalService(userId, year);
};

