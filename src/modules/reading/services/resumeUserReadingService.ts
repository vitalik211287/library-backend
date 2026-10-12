import prisma from "../../../utils/prisma.js";
import { updateUserBookService } from "../../user-books/services/updateUserBookService.js";
import type { PostCommitEffect } from "../../user-books/services/updateUserBookService.js";

import {
  getActiveUserReadingSession,
  resumeUserReadingSession,
  resumeTrackedEbookReadingSession,
} from "../repositories/userReadingRepository.js";

export const resumeUserReadingService = async (
  userId: string,
  bookId: string,
  readerLeaseId?: string,
) => {
  const session = await getActiveUserReadingSession(userId, bookId);

  if (!session) {
    throw new Error("No active reading session");
  }

  if (
    session.source === "EBOOK" &&
    session.readerLeaseId !== null &&
    session.readerLeaseId !== readerLeaseId
  ) {
    throw new Error("EPUB reader ownership has changed");
  }

  if (!session.pausedAt) {
    throw new Error("Reading session is not paused");
  }

  const heartbeatEnabled =
    session.source === "EBOOK" &&
    session.progressMode === "PERCENT" &&
    session.lastHeartbeatAt !== null &&
    session.verifiedSeconds !== null;

  if (!heartbeatEnabled) {
    const result = await resumeUserReadingSession(
      session.id,
      session.pausedAt,
      session.pausedSeconds,
    );

    await updateUserBookService(userId, bookId, {
      progressMode: session.progressMode,
      status: "READING",
    });

    return result;
  }

  const postCommitEffects: PostCommitEffect[] = [];

  const result = await prisma.$transaction(async (tx) => {
    const updated = await resumeTrackedEbookReadingSession(
      userId,
      bookId,
      session.id,
      readerLeaseId,
      tx,
    );

    await updateUserBookService(
      userId,
      bookId,
      {
        progressMode: session.progressMode,
        status: "READING",
      },
      tx,
      postCommitEffects,
    );

    return updated;
  });

  for (const effect of postCommitEffects) {
    try {
      await effect();
    } catch (error) {
      console.warn("EPUB notification failed after commit", error);
    }
  }

  return result;
};


