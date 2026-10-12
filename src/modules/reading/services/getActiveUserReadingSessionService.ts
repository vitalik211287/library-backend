import { getBookById } from "../../books/repositories/booksRepository.js";

import { getActiveUserReadingSession } from "../repositories/userReadingRepository.js";
import { calculateVerifiedEbookSeconds } from "../utils/ebookHeartbeatTime.js";

export const getActiveUserReadingSessionService = async (
  userId: string,
  bookId: string,
) => {
  const book = await getBookById(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  const session = await getActiveUserReadingSession(userId, bookId);

  if (!session) {
    return {
      session: null,
      elapsedSeconds: 0,
    };
  }

  const now = Date.now();

  const totalElapsedSeconds = Math.max(
    Math.floor((now - session.startedAt.getTime()) / 1000),
    0,
  );

  let totalPausedSeconds = session.pausedSeconds;

  if (session.pausedAt) {
    const currentPauseSeconds = Math.max(
      Math.floor((now - session.pausedAt.getTime()) / 1000),
      0,
    );

    totalPausedSeconds += currentPauseSeconds;
  }

  const legacyElapsedSeconds = Math.max(
    totalElapsedSeconds - totalPausedSeconds,
    0,
  );

  const verifiedTime = session.source === "EBOOK"
    ? calculateVerifiedEbookSeconds({
        verifiedSeconds: session.verifiedSeconds,
        lastHeartbeatAt: session.lastHeartbeatAt,
        pausedAt: session.pausedAt,
        now: new Date(now),
      })
    : null;

  const elapsedSeconds = verifiedTime ?? legacyElapsedSeconds;

  return {
    session: { ...session, readerLeaseId: undefined },
    elapsedSeconds,
  };
};


