import prisma from "../../../utils/prisma.js";
import { getBookById } from "../../books/repositories/booksRepository.js";
import { getOrCreateUserBook } from "../../user-books/repositories/userBooksRepository.js";

type OfflineManualSession = {
  clientSessionId: string;
  startedAt: Date;
  finishedAt: Date;
  startPage: number;
  endPage: number;
  durationSeconds: number;
};

export class OfflineManualSyncError extends Error {
  constructor(message: string, public readonly status: number = 400) {
    super(message);
  }
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UTC_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

const parseSession = (body: unknown): OfflineManualSession => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new OfflineManualSyncError("Invalid offline session");
  }

  const value = body as Record<string, unknown>;
  if (typeof value.clientSessionId !== "string" || !UUID_V4.test(value.clientSessionId)) {
    throw new OfflineManualSyncError("A version-4 clientSessionId is required");
  }
  if (
    typeof value.startedAt !== "string" ||
    typeof value.finishedAt !== "string" ||
    !UTC_ISO.test(value.startedAt) ||
    !UTC_ISO.test(value.finishedAt)
  ) {
    throw new OfflineManualSyncError("UTC ISO timestamps are required");
  }

  const startedAt = new Date(value.startedAt);
  const finishedAt = new Date(value.finishedAt);
  const elapsedMs = finishedAt.getTime() - startedAt.getTime();
  if (
    !Number.isFinite(elapsedMs) ||
    elapsedMs <= 0 ||
    finishedAt.getTime() > Date.now() + 5 * 60_000
  ) {
    throw new OfflineManualSyncError("Invalid offline session interval");
  }

  if (
    typeof value.startPage !== "number" ||
    !Number.isSafeInteger(value.startPage) ||
    value.startPage < 0 ||
    typeof value.endPage !== "number" ||
    !Number.isSafeInteger(value.endPage) ||
    value.endPage < value.startPage
  ) {
    throw new OfflineManualSyncError("Invalid reading pages");
  }
  if (
    typeof value.durationSeconds !== "number" ||
    !Number.isSafeInteger(value.durationSeconds) ||
    value.durationSeconds < 1 ||
    value.durationSeconds > 12 * 60 * 60 ||
    value.durationSeconds > Math.ceil(elapsedMs / 1000)
  ) {
    throw new OfflineManualSyncError("Invalid offline reading duration");
  }

  return {
    clientSessionId: value.clientSessionId,
    startedAt,
    finishedAt,
    startPage: value.startPage,
    endPage: value.endPage,
    durationSeconds: value.durationSeconds,
  };
};

export const syncOfflineManualSessionService = async (
  userId: string,
  bookId: string,
  body: unknown,
) => {
  const input = parseSession(body);
  const book = await getBookById(bookId);
  if (!book) throw new OfflineManualSyncError("Book not found", 404);
  if (book.pages !== null && input.endPage > book.pages) {
    throw new OfflineManualSyncError("End page exceeds book length");
  }

  // This upsert is idempotent and ensures there is a row to lock below.
  await getOrCreateUserBook(userId, bookId);

  return prisma.$transaction(async (tx) => {
    // Serialize offline imports for this user and book. In particular, two
    // different UUIDs cannot both pass the overlap check concurrently.
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "UserBook"
      WHERE "userId" = ${userId} AND "bookId" = ${bookId}
      FOR UPDATE
    `;

    const existing = await tx.readingSession.findUnique({
      where: { id: input.clientSessionId },
    });
    if (existing) {
      const same =
        existing.userId === userId &&
        existing.bookId === bookId &&
        existing.source === "MANUAL" &&
        existing.progressMode === "PAGES" &&
        existing.startedAt.getTime() === input.startedAt.getTime() &&
        existing.finishedAt?.getTime() === input.finishedAt.getTime() &&
        existing.startPage === input.startPage &&
        existing.endPage === input.endPage &&
        existing.durationSeconds === input.durationSeconds;

      if (!same) {
        throw new OfflineManualSyncError("Offline session ID conflict", 409);
      }
      return { session: existing, alreadySynced: true, progressApplied: false };
    }

    // Offline time must not silently overlap another recorded session.
    // Such a conflict needs explicit resolution, not automatic time credit.
    const overlap = await tx.readingSession.findFirst({
      where: {
        userId,
        bookId,
        startedAt: { lt: input.finishedAt },
        OR: [
          { finishedAt: null },
          { finishedAt: { gt: input.startedAt } },
        ],
      },
      select: { id: true },
    });
    if (overlap) {
      throw new OfflineManualSyncError("Overlapping reading session", 409);
    }

    const session = await tx.readingSession.create({
      data: {
        id: input.clientSessionId,
        userId,
        bookId,
        source: "MANUAL",
        progressMode: "PAGES",
        startedAt: input.startedAt,
        finishedAt: input.finishedAt,
        startPage: input.startPage,
        endPage: input.endPage,
        durationSeconds: input.durationSeconds,
        pausedSeconds: 0,
        pausedAt: null,
      },
    });

    // The row is locked above, so another offline import cannot race this
    // check. Never overwrite newer progress or switch a percent-based book.
    const userBook = await tx.userBook.findUniqueOrThrow({
      where: { userId_bookId: { userId, bookId } },
      select: { currentPage: true, progressMode: true },
    });
    const progressApplied =
      userBook.progressMode === "PAGES" &&
      input.endPage > userBook.currentPage;

    if (progressApplied) {
      await tx.userBook.update({
        where: { userId_bookId: { userId, bookId } },
        data: { currentPage: input.endPage },
      });
      await tx.activityLog.create({
        data: {
          userId,
          bookId,
          type: "PROGRESS_CHANGED",
          oldValue: String(userBook.currentPage),
          newValue: String(input.endPage),
        },
      });
    }

    return {
      session,
      alreadySynced: false,
      progressApplied,
      currentPage: progressApplied ? input.endPage : userBook.currentPage,
    };
  });
};
