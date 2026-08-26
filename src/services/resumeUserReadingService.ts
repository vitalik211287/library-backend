import {
  getActiveUserReadingSession,
  resumeUserReadingSession,
} from "../repositories/userReadingRepository.js";

export const resumeUserReadingService = async (
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

  if (!session.pausedAt) {
    throw new Error(
      "Reading session is not paused",
    );
  }

  return resumeUserReadingSession(
    session.id,
    session.pausedAt,
    session.pausedSeconds,
  );
};