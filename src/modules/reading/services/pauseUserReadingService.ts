import prisma from "../../../utils/prisma.js";
import { updateUserBookService } from "../../user-books/services/updateUserBookService.js";
import type { PostCommitEffect } from "../../user-books/services/updateUserBookService.js";

import {
  getActiveUserReadingSession,
  pauseUserReadingSession,
  pauseTrackedEbookReadingSession,
} from "../repositories/userReadingRepository.js";
export const pauseUserReadingService = async (
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

  if (session.pausedAt) {
    throw new Error("Reading session is already paused");
  }

  const heartbeatEnabled =
    session.source === "EBOOK" &&
    session.progressMode === "PERCENT" &&
    session.lastHeartbeatAt !== null &&
    session.verifiedSeconds !== null;

  if (!heartbeatEnabled) {
    const result = await pauseUserReadingSession(session.id);

    await updateUserBookService(userId, bookId, {
      progressMode: session.progressMode,
      status: "PAUSED",
    });

    return result;
  }

  const postCommitEffects: PostCommitEffect[] = [];

  const result = await prisma.$transaction(async (tx) => {
    const updated = await pauseTrackedEbookReadingSession(
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
        status: "PAUSED",
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


