import prisma from "../../../utils/prisma.js";

import {
  updateUserBookService,
  type PostCommitEffect,
} from "../../user-books/services/updateUserBookService.js";

import { claimUserEbookSession } from "../repositories/userReadingRepository.js";

export const claimUserEbookSessionService = async (
  userId: string,
  bookId: string,
  sessionId: string,
) => {
  const postCommitEffects: PostCommitEffect[] = [];

  const claimed = await prisma.$transaction(async (tx) => {
    const result = await claimUserEbookSession(
      userId,
      bookId,
      sessionId,
      tx,
    );

    await updateUserBookService(
      userId,
      bookId,
      {
        progressMode: "PERCENT",
        status: "READING",
      },
      tx,
      postCommitEffects,
    );

    return result;
  });

  for (const effect of postCommitEffects) {
    try {
      await effect();
    } catch (error) {
      console.warn("EPUB claim notification failed after commit", error);
    }
  }

  return claimed;
};
