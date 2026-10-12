import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

const url = new URL(process.env.DATABASE_URL ?? "http://invalid");

if (
  url.hostname !== "127.0.0.1" ||
  url.port !== "55434" ||
  url.pathname !== "/library_epub_test" ||
  url.username !== "epub_test"
) {
  throw new Error("REFUSING TO RUN OUTSIDE ISOLATED TEST DATABASE");
}

test("EPUB finish preserves verified reading statistics", async () => {
  const { default: prisma } = await import("../../../utils/prisma.js");
  const repo = await import("../repositories/userReadingRepository.js");
  const { finishUserReadingService } =
    await import("../services/finishUserReadingService.js");
  const { updateUserBookService } =
    await import("../../user-books/services/updateUserBookService.js");

  let userId: string | null = null;
  let bookId: string | null = null;

  try {
    const suffix = randomUUID();

    const user = await prisma.user.create({
      data: {
        email: "epub-finish-" + suffix + "@example.invalid",
        passwordHash: "test-only",
      },
    });
    userId = user.id;

    const book = await prisma.book.create({
      data: {
        isbn: "epub-finish-" + suffix,
        title: "EPUB finish integration test",
        author: "Test Author",
      },
    });
    bookId = book.id;

    await prisma.userBook.create({
      data: {
        userId: user.id,
        bookId: book.id,
        progressMode: "PERCENT",
        currentPercent: 10,
        status: "READING",
      },
    });

    const first = await repo.createUserReadingSession(
      user.id,
      book.id,
      {
        source: "EBOOK",
        progressMode: "PERCENT",
        startPercent: 10,
      },
    );

    const lease = first.readerLeaseId;
    if (!lease) throw new Error("Missing EPUB reader lease");

    const staleSession = await prisma.readingSession.update({
      where: { id: first.id },
      data: {
        startedAt: new Date(Date.now() - 195000),
        lastHeartbeatAt: new Date(Date.now() - 180000),
        verifiedSeconds: 25,
      },
    });

    await assert.rejects(
      () => finishUserReadingService(user.id, book.id, {
        endPercent: 40,
        readerLeaseId: randomUUID(),
      }),
      /EPUB reader ownership has changed/,
    );

    assert.equal(
      (await prisma.readingSession.findUniqueOrThrow({
        where: { id: first.id },
      })).finishedAt,
      null,
    );

    console.log("PASS: Wrong reader lease cannot finish session");

    await assert.rejects(
      () => prisma.$transaction(async (tx) => {
        await repo.finishUserReadingSession(
          first.id,
          {
            progressMode: "PERCENT",
            endPercent: 40,
            durationSeconds: 70,
            pausedSeconds: 0,
            expectedReaderLeaseId: lease,
            expectedEbookHeartbeat: {
              lastHeartbeatAt: staleSession.lastHeartbeatAt!,
              verifiedSeconds: staleSession.verifiedSeconds!,
              pausedAt: null,
            },
          },
          tx,
        );

        await updateUserBookService(
          user.id,
          book.id,
          {
            progressMode: "PERCENT",
            currentPercent: 40,
            status: "READING",
          },
          tx,
          [],
        );

        throw new Error("FORCED_FINISH_ROLLBACK");
      }),
      /FORCED_FINISH_ROLLBACK/,
    );

    const rolledBackSession =
      await prisma.readingSession.findUniqueOrThrow({
        where: { id: first.id },
      });

    const rolledBackBook = await prisma.userBook.findUniqueOrThrow({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: book.id,
        },
      },
    });

    assert.equal(rolledBackSession.finishedAt, null);
    assert.equal(rolledBackBook.currentPercent, 10);
    assert.equal(rolledBackBook.status, "READING");

    console.log("PASS: Transaction rollback preserves session and progress");

    const finished = await finishUserReadingService(
      user.id,
      book.id,
      {
        endPercent: 40,
        epubStartPositionPercent: 10,
        epubEndPositionPercent: 40,
        readerLeaseId: lease,
      },
    );

    assert.ok(finished.finishedAt);
    assert.equal(finished.durationSeconds, 70);
    assert.equal(finished.endPercent, 40);

    const savedBook = await prisma.userBook.findUniqueOrThrow({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: book.id,
        },
      },
    });

    assert.equal(savedBook.currentPercent, 40);
    assert.equal(savedBook.status, "READING");

    console.log("PASS: Finish saves capped verified time and progress");

    await assert.rejects(
      () => finishUserReadingService(user.id, book.id, {
        endPercent: 40,
        readerLeaseId: lease,
      }),
      /No active reading session/,
    );

    const unchangedSession =
      await prisma.readingSession.findUniqueOrThrow({
        where: { id: first.id },
      });

    assert.equal(unchangedSession.durationSeconds, 70);

    console.log("PASS: Duplicate finish is rejected");

    const second = await repo.createUserReadingSession(
      user.id,
      book.id,
      {
        source: "EBOOK",
        progressMode: "PERCENT",
        startPercent: 40,
      },
    );

    if (!second.readerLeaseId) {
      throw new Error("Missing second EPUB reader lease");
    }

    await finishUserReadingService(user.id, book.id, {
      endPercent: 100,
      epubReachedEnd: true,
      readerLeaseId: second.readerLeaseId,
    });

    const completedBook = await prisma.userBook.findUniqueOrThrow({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: book.id,
        },
      },
    });

    assert.equal(completedBook.status, "FINISHED");
    assert.equal(completedBook.currentPercent, 100);

    console.log("PASS: Reaching EPUB end finishes book");
  } finally {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } });
    }

    if (bookId) {
      await prisma.book.delete({ where: { id: bookId } });
    }

    await prisma.$disconnect();
  }
});
