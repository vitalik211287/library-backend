import {
  getActiveUserReadingSession,
  pauseUserReadingSession,
} from "../repositories/userReadingRepository.js";

export const pauseUserReadingService = async (
  userId: string,
  bookId: string,
) => {
  const session =
    await getActiveUserReadingSession(
      userId,
      bookId,
    );

  if (!session) {
    throw new Error(
      "No active reading session",
    );
  }

  if (session.pausedAt) {
    throw new Error(
      "Reading session is already paused",
    );
  }

  return pauseUserReadingSession(
    session.id,
  );
};