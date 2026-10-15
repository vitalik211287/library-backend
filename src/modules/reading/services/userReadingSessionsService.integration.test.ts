import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import prisma from "../../../utils/prisma.js";
import { updateUserReadingSessionService } from "./userReadingSessionsService.js";
import { getUserReadingStatsService } from "./getUserReadingStatsService.js";

const url = new URL(
  process.env.DATABASE_URL ?? "postgresql://invalid@localhost/",
);

if (
  url.hostname !== "127.0.0.1" ||
  url.port !== "55434" ||
  url.pathname !== "/library_epub_test"
) {
  throw new Error("This test requires the isolated library_epub_test database");
}

test("manual session time edit updates timestamps without changing book progress", async () => {
  const nonce = randomUUID().replaceAll("-", "");
  const user = await prisma.user.create({
    data: {
      email: `session-edit-${nonce}@example.invalid`,
      passwordHash: "TEST_ONLY",
    },
  });

  let bookId: string | null = null;

  try {
    const book = await prisma.book.create({
      data: {
        isbn: `SESSION-EDIT-${nonce}`,
        title: "Reading session edit integration test",
        author: "Test",
        pages: 200,
      },
    });

    bookId = book.id;

    await prisma.userBook.create({
      data: {
        userId: user.id,
        bookId,
        progressMode: "PAGES",
        currentPage: 80,
        status: "READING",
      },
    });

    const originalStart = new Date(Date.now() - 60 * 60_000);

    const session = await prisma.readingSession.create({
      data: {
        userId: user.id,
        bookId,
        source: "MANUAL",
        progressMode: "PAGES",
        startedAt: originalStart,
        finishedAt: new Date(originalStart.getTime() + 20 * 60_000),
        startPage: 40,
        endPage: 60,
        durationSeconds: 1200,
        pausedSeconds: 0,
      },
    });

    const newStart = new Date(Date.now() - 45 * 60_000);

    await updateUserReadingSessionService(user.id, bookId, session.id, {
      startedAt: newStart.toISOString(),
      durationSeconds: 1800,
    });

    const updatedSession = await prisma.readingSession.findUniqueOrThrow({
      where: { id: session.id },
    });

    assert.equal(updatedSession.startedAt.getTime(), newStart.getTime());
    assert.equal(updatedSession.durationSeconds, 1800);
    assert.equal(
      updatedSession.finishedAt?.getTime(),
      newStart.getTime() + 1800 * 1000,
    );
    assert.equal(updatedSession.endPage, 60);

    const updatedUserBook = await prisma.userBook.findUniqueOrThrow({
      where: {
        userId_bookId: { userId: user.id, bookId },
      },
    });

    assert.equal(updatedUserBook.currentPage, 80);
    const stats = await getUserReadingStatsService(user.id, bookId);

    assert.equal(stats.totalReadingSeconds, 1800);
    assert.equal(stats.longestSessionSeconds, 1800);
    assert.equal(stats.sessionsCount, 1);
    const secondStart = new Date(Date.now() - 20 * 60_000);

    await prisma.readingSession.create({
      data: {
        userId: user.id,
        bookId,
        source: "MANUAL",
        progressMode: "PAGES",
        startedAt: secondStart,
        finishedAt: new Date(secondStart.getTime() + 10 * 60_000),
        startPage: 60,
        endPage: 70,
        durationSeconds: 600,
        pausedSeconds: 0,
      },
    });

    await assert.rejects(
      updateUserReadingSessionService(user.id, bookId, session.id, {
        startedAt: new Date(secondStart.getTime() - 5 * 60_000).toISOString(),
        durationSeconds: 600,
      }),
      /overlaps another session/,
    );

    const unchangedSession = await prisma.readingSession.findUniqueOrThrow({
      where: { id: session.id },
    });

    assert.equal(unchangedSession.startedAt.getTime(), newStart.getTime());
    assert.equal(unchangedSession.durationSeconds, 1800);
    const ebookStart = new Date(Date.now() - 8 * 60_000);

    const ebookSession = await prisma.readingSession.create({
      data: {
        userId: user.id,
        bookId,
        source: "EBOOK",
        progressMode: "PAGES",
        startedAt: ebookStart,
        finishedAt: new Date(ebookStart.getTime() + 5 * 60_000),
        startPage: 70,
        endPage: 75,
        durationSeconds: 300,
        pausedSeconds: 0,
      },
    });

    await assert.rejects(
      updateUserReadingSessionService(user.id, bookId, ebookSession.id, {
        durationSeconds: 600,
      }),
      /Time editing is not supported for this session/,
    );

    const unchangedEbook = await prisma.readingSession.findUniqueOrThrow({
      where: { id: ebookSession.id },
    });

    assert.equal(unchangedEbook.durationSeconds, 300);
  } finally {
    await prisma.readingSession.deleteMany({
      where: { userId: user.id },
    });
    await prisma.activityLog.deleteMany({
      where: { userId: user.id },
    });
    await prisma.userBook.deleteMany({
      where: { userId: user.id },
    });
    await prisma.user.delete({ where: { id: user.id } });

    if (bookId) {
      await prisma.book.delete({ where: { id: bookId } });
    }

    await prisma.$disconnect();
  }
});
