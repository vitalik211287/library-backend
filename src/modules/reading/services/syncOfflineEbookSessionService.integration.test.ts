import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

// This test creates and deletes records. Refuse all production/local-primary DBs.
const dbUrl = new URL(process.env.DATABASE_URL ?? "postgresql://invalid@localhost/invalid");
if (
  dbUrl.hostname !== "127.0.0.1" ||
  dbUrl.port !== "55434" ||
  dbUrl.pathname !== "/library_epub_test" ||
  dbUrl.username !== "epub_test"
) {
  throw new Error("REFUSING TO RUN OUTSIDE 127.0.0.1:55434/library_epub_test (epub_test)");
}

test("offline EPUB sync: progress, idempotency, conflicts and verified-time separation", async () => {
  // Import only after the isolated-database guard has passed.
  const { default: prisma } = await import("../../../utils/prisma.js");
  const { syncOfflineEbookSessionService: sync } = await import(
    "./syncOfflineEbookSessionService.js"
  );
  const { OfflineEbookSyncError } = await import("./offlineEbookSyncValidation.js");

  const nonce = randomUUID().replaceAll("-", "");
  const now = Date.now();
  const at = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();
  const user = await prisma.user.create({
    data: { email: `offline-epub-${nonce}@example.invalid`, passwordHash: "TEST_ONLY" },
  });
  let bookId: string | null = null;

  try {
    const book = await prisma.book.create({
      data: { isbn: `OFFLINE-EPUB-${nonce}`, title: "Offline EPUB sync test", author: "Test", pages: 200 },
    });
    bookId = book.id;
    await prisma.userBook.create({
      data: {
        userId: user.id,
        bookId: book.id,
        progressMode: "PERCENT",
        currentPercent: 12,
        status: "READING",
      },
    });

    const payload = (
      clientSessionId: string,
      fromMinutes: number,
      toMinutes: number,
      startPercent: number,
      endPercent: number,
      durationSeconds: number,
    ) => ({
      source: "EBOOK" as const,
      progressMode: "PERCENT" as const,
      clientSessionId,
      startedAt: at(fromMinutes),
      finishedAt: at(toMinutes),
      startPercent,
      endPercent,
      durationSeconds,
      epubStartPositionPercent: 65,
      epubEndPositionPercent: 35, // Navigation may go backwards while cumulative progress advances.
    });

    const first = payload(randomUUID(), 28, 27, 12, 17, 40);
    const created = await sync(user.id, book.id, first);
    assert.equal(created.alreadySynced, false);
    assert.equal(created.progressApplied, true);
    assert.equal(created.currentPercent, 17);
    assert.equal(created.session.id, first.clientSessionId);
    assert.equal(created.session.source, "EBOOK");
    assert.equal(created.session.progressMode, "PERCENT");
    assert.equal(created.session.durationSeconds, 40);
    assert.equal(created.session.verifiedSeconds, null); // No fake online heartbeat.
    assert.equal(created.session.epubStartPositionPercent, 65);
    assert.equal(created.session.epubEndPositionPercent, 35);

    // A retry must acknowledge the existing record, not credit it twice.
    const replay = await sync(user.id, book.id, first);
    assert.equal(replay.alreadySynced, true);
    assert.equal(await prisma.readingSession.count({
      where: { userId: user.id, bookId: book.id },
    }), 1);
    assert.equal(await prisma.activityLog.count({
      where: { userId: user.id, bookId: book.id, type: "PROGRESS_CHANGED" },
    }), 1);

    // Reusing an id with altered data, or importing overlapping time, must fail.
    await assert.rejects(
      () => sync(user.id, book.id, { ...first, endPercent: 18 }),
      (error: unknown) => error instanceof OfflineEbookSyncError && error.status === 409,
    );
    await assert.rejects(
      () => sync(user.id, book.id, payload(randomUUID(), 27.5, 26.5, 17, 18, 20)),
      (error: unknown) => error instanceof OfflineEbookSyncError && error.status === 409,
    );

    // Another device already read farther ahead. Older offline progress must not rewind it.
    await prisma.userBook.update({
      where: { userId_bookId: { userId: user.id, bookId: book.id } },
      data: { currentPercent: 70 },
    });
    const older = await sync(user.id, book.id, payload(randomUUID(), 24, 23, 17, 19, 20));
    assert.equal(older.progressApplied, false);
    assert.equal(older.currentPercent, 70);

    const newer = await sync(user.id, book.id, payload(randomUUID(), 22, 21, 70, 74, 30));
    assert.equal(newer.progressApplied, true);
    assert.equal(newer.currentPercent, 74);

    // Conflicts must also detect existing *manual* sessions, not just EPUBs.
    await prisma.readingSession.create({
      data: {
        userId: user.id,
        bookId: book.id,
        source: "MANUAL",
        progressMode: "PAGES",
        startPage: 1,
        endPage: 2,
        startedAt: new Date(at(16)),
        finishedAt: new Date(at(15)),
        durationSeconds: 50,
      },
    });
    await assert.rejects(
      () => sync(user.id, book.id, payload(randomUUID(), 16.5, 15.5, 74, 75, 20)),
      (error: unknown) => error instanceof OfflineEbookSyncError && error.status === 409,
    );

    const userBook = await prisma.userBook.findUniqueOrThrow({
      where: { userId_bookId: { userId: user.id, bookId: book.id } },
    });
    assert.equal(userBook.currentPercent, 74);
    assert.equal(userBook.progressMode, "PERCENT");
    assert.equal(await prisma.readingSession.count({
      where: { userId: user.id, bookId: book.id },
    }), 4); // Three EPUB imports and one pre-existing manual session.
    assert.equal(await prisma.activityLog.count({
      where: { userId: user.id, bookId: book.id, type: "PROGRESS_CHANGED" },
    }), 2); // Only real progress increases create events.
  } finally {
    // Delete only this test's randomly named data.
    await prisma.user.delete({ where: { id: user.id } });
    if (bookId) await prisma.book.delete({ where: { id: bookId } });
    await prisma.$disconnect();
  }
});
