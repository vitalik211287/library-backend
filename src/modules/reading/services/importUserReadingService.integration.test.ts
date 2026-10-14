import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import prisma from "../../../utils/prisma.js";
import { importUserReadingService } from "./importUserReadingService.js";

const url = new URL(
  process.env.DATABASE_URL ?? "postgresql://invalid@localhost/"
);

if (
  url.hostname !== "127.0.0.1" ||
  url.port !== "55434" ||
  url.pathname !== "/library_epub_test"
) {
  throw new Error("This test requires the isolated library_epub_test database");
}

test("manual reading import validates sessions and preserves progress", async () => {
  const nonce = randomUUID().replaceAll("-", "");

  const user = await prisma.user.create({
    data: {
      email: `manual-import-${nonce}@example.invalid`,
      passwordHash: "TEST_ONLY",
    },
  });

  let bookId: string | null = null;

  try {
    const book = await prisma.book.create({
      data: {
        isbn: `MANUAL-TEST-${nonce}`,
        title: "Manual reading integration test",
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
        currentPage: 10,
        status: "READING",
      },
    });

    const base = Date.now() - 30 * 60_000;

    const payload = (
      startedAt: number,
      finishedAt: number,
      startPage: number,
      endPage: number
    ) => ({
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date(finishedAt).toISOString(),
      startPage,
      endPage,
      durationSeconds: Math.floor((finishedAt - startedAt) / 1000),
    });

    const first = payload(base, base + 5 * 60_000, 10, 20);

    await importUserReadingService(user.id, bookId, first);

    let userBook = await prisma.userBook.findUniqueOrThrow({
      where: { userId_bookId: { userId: user.id, bookId } },
    });

    assert.equal(userBook.currentPage, 20);

    await assert.rejects(
      importUserReadingService(user.id, bookId, first),
      /overlaps/
    );

    await assert.rejects(
      importUserReadingService(
        user.id,
        bookId,
        payload(base + 60_000, base + 4 * 60_000, 12, 19)
      ),
      /overlaps/
    );

    await prisma.userBook.update({
      where: { userId_bookId: { userId: user.id, bookId } },
      data: { currentPage: 60 },
    });

    await importUserReadingService(
      user.id,
      bookId,
      payload(base - 10 * 60_000, base - 5 * 60_000, 5, 10)
    );

    userBook = await prisma.userBook.findUniqueOrThrow({
      where: { userId_bookId: { userId: user.id, bookId } },
    });

    assert.equal(userBook.currentPage, 60);

    assert.equal(
      await prisma.readingSession.count({
        where: { userId: user.id, bookId },
      }),
      2
    );
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
