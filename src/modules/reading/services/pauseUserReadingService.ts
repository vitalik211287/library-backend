import { updateUserReadingProgress } from "../../user-books/repositories/userBooksRepository.js";

import {
  getActiveUserReadingSession,
  pauseUserReadingSession,
} from "../repositories/userReadingRepository.js";
export const pauseUserReadingService = async (
  userId: string,
  bookId: string,
) => {
  const session = await getActiveUserReadingSession(userId, bookId);

  if (!session) {
    throw new Error("No active reading session");
  }

  if (session.pausedAt) {
    throw new Error("Reading session is already paused");
  }

  const pausedSession = await pauseUserReadingSession(session.id);

  await updateUserReadingProgress(userId, bookId, {
    progressMode: session.progressMode,
    status: "PAUSED",
  });

  return pausedSession;
};


