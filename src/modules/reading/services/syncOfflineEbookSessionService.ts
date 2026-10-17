import prisma from "../../../utils/prisma.js";
import { getBookById } from "../../books/repositories/booksRepository.js";
import { getOrCreateUserBook } from "../../user-books/repositories/userBooksRepository.js";
import { OfflineEbookSyncError, parseOfflineEbookSession } from "./offlineEbookSyncValidation.js";

/**
 * Imports a completed EPUB session recorded while disconnected. Do not use
 * online heartbeat leases for this data: an offline session was never owned
 * by the online session manager. Existing online sessions must not overlap.
 */
export const syncOfflineEbookSessionService = async (
  userId: string,
  bookId: string,
  body: unknown,
) => {
  const input = parseOfflineEbookSession(body);
  const book = await getBookById(bookId);
  if (!book) throw new OfflineEbookSyncError("Book not found", 404);

  // Ensure there is a row to lock. Match the existing manual offline importer.
  await getOrCreateUserBook(userId, bookId);

  return prisma.$transaction(async (tx) => {
    // The lock serializes imports of *either* reading source for this book.
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
        existing.userId === userId && existing.bookId === bookId &&
        existing.source === "EBOOK" && existing.progressMode === "PERCENT" &&
        existing.startedAt.getTime() === input.startedAt.getTime() &&
        existing.finishedAt?.getTime() === input.finishedAt.getTime() &&
        existing.startPercent === input.startPercent &&
        existing.endPercent === input.endPercent &&
        existing.durationSeconds === input.durationSeconds &&
        existing.epubStartPositionPercent === input.epubStartPositionPercent &&
        existing.epubEndPositionPercent === input.epubEndPositionPercent;
      if (!same) throw new OfflineEbookSyncError("Offline session ID conflict", 409);
      return { session: existing, alreadySynced: true, progressApplied: false };
    }

    // Reject overlap with both manual and online EPUB sessions. Never double
    // count time when a connected reader was already running.
    const overlap = await tx.readingSession.findFirst({
      where: {
        userId,
        bookId,
        startedAt: { lt: input.finishedAt },
        OR: [{ finishedAt: null }, { finishedAt: { gt: input.startedAt } }],
      },
      select: { id: true },
    });
    if (overlap) throw new OfflineEbookSyncError("Overlapping reading session", 409);

    const session = await tx.readingSession.create({
      data: {
        id: input.clientSessionId,
        userId,
        bookId,
        source: "EBOOK",
        progressMode: "PERCENT",
        startedAt: input.startedAt,
        finishedAt: input.finishedAt,
        startPage: 0, // Required for all sessions; EPUB uses startPercent.
        startPercent: input.startPercent,
        endPercent: input.endPercent,
        epubStartPositionPercent: input.epubStartPositionPercent,
        epubEndPositionPercent: input.epubEndPositionPercent,
        durationSeconds: input.durationSeconds,
        pausedSeconds: 0,
        pausedAt: null,
        // No server heartbeat: do not label offline seconds as verified.
        verifiedSeconds: null,
        lastHeartbeatAt: null,
        readerLeaseId: null,
      },
    });

    const userBook = await tx.userBook.findUniqueOrThrow({
      where: { userId_bookId: { userId, bookId } },
      select: { currentPage: true, currentPercent: true, progressMode: true, status: true },
    });
    // Don't switch an established page-based book to percent progress. A book
    // with no page progress can safely adopt EPUB percent mode on first read.
    const adoptPercent = userBook.progressMode === "PAGES" &&
      userBook.currentPage === 0 && userBook.currentPercent === 0 &&
      userBook.status !== "FINISHED";
    const percentMode = userBook.progressMode === "PERCENT" || adoptPercent;
    const progressApplied = percentMode && input.endPercent > userBook.currentPercent;
    if (adoptPercent || progressApplied) {
      await tx.userBook.update({
        where: { userId_bookId: { userId, bookId } },
        data: {
          ...(adoptPercent && { progressMode: "PERCENT" }),
          ...(progressApplied && { currentPercent: input.endPercent }),
        },
      });
    }
    if (progressApplied) {
      await tx.activityLog.create({
        data: {
          userId,
          bookId,
          type: "PROGRESS_CHANGED",
          oldValue: String(userBook.currentPercent),
          newValue: String(input.endPercent),
        },
      });
    }

    return {
      session,
      alreadySynced: false,
      progressApplied,
      currentPercent: progressApplied ? input.endPercent : userBook.currentPercent,
    };
  });
};
