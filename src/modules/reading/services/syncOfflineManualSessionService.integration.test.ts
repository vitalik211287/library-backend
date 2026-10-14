import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import prisma from "../../../utils/prisma.js";
import { syncOfflineManualSessionService } from "./syncOfflineManualSessionService.js";

// Refuse to run against the primary or any unrecognized database.
const url = new URL(process.env.DATABASE_URL ?? "postgresql://invalid@localhost/");
if (
  url.hostname !== "127.0.0.1" ||
  url.port !== "55434" ||
  url.pathname !== "/library_epub_test"
) {
  throw new Error("This integration test requires 127.0.0.1:55434/library_epub_test");
}

test("offline import never decreases progress and retries do not duplicate", async () => {
  const nonce = randomUUID().replaceAll("-", "");
  const user = await prisma.user.create({
    data: {
      email: `offline-sync-test-${nonce}@example.invalid`,
      passwordHash: "TEST_ONLY",
    },
  });
  let bookId: string | null = null;
  try {
    const book = await prisma.book.create({
      data: {
        isbn: `TEST-${nonce}`,
        title: "Offline sync integration test",
        author: "Test",
        pages: 200,
      },
    });
    bookId = book.id;
    await prisma.userBook.create({
      data: { userId: user.id, bookId: book.id, progressMode: "PAGES", currentPage: 47 },
    });

    const base = Date.now() - 10 * 60_000;
    const payload = (id: string, offset: number) => ({
      clientSessionId: id,
      startedAt: new Date(base + offset * 60_000).toISOString(),
      finishedAt: new Date(base + (offset + 1) * 60_000).toISOString(),
      startPage: 47,
      endPage: 48,
      durationSeconds: 25,
    });

    const first = payload(randomUUID(), 0);
    const imported = await syncOfflineManualSessionService(user.id, book.id, first);
    assert.equal(imported.alreadySynced, false);
    assert.equal(imported.progressApplied, true);
    assert.equal((await prisma.userBook.findUniqueOrThrow({ where: {
      userId_bookId: { userId: user.id, bookId: book.id },
    } })).currentPage, 48);

    // Simulate another device having read farther ahead.
    await prisma.userBook.update({
      where: { userId_bookId: { userId: user.id, bookId: book.id } },
      data: { currentPage: 60 },
    });
    const second = payload(randomUUID(), 2);
    const older = await syncOfflineManualSessionService(user.id, book.id, second);
    assert.equal(older.alreadySynced, false);
    assert.equal(older.progressApplied, false);
    const retried = await syncOfflineManualSessionService(user.id, book.id, second);
    assert.equal(retried.alreadySynced, true);
    assert.equal(retried.progressApplied, false);
    assert.equal((await prisma.userBook.findUniqueOrThrow({ where: {
      userId_bookId: { userId: user.id, bookId: book.id },
    } })).currentPage, 60);
    assert.equal(await prisma.readingSession.count({
      where: { userId: user.id, bookId: book.id },
    }), 2);
    assert.equal(await prisma.activityLog.count({
      where: { userId: user.id, bookId: book.id, type: "PROGRESS_CHANGED" },
    }), 1);
  } finally {
    // Only test-owned data are deleted. Never touch real library entries.
    await prisma.readingSession.deleteMany({ where: { userId: user.id } });
    await prisma.activityLog.deleteMany({ where: { userId: user.id } });
    await prisma.userBook.deleteMany({ where: { userId: user.id } });
    if (bookId) await prisma.book.delete({ where: { id: bookId } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});
