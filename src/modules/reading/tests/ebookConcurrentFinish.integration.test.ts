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

test("Concurrent EPUB finish and heartbeat preserve statistics", async () => {
  const { default: prisma } = await import("../../../utils/prisma.js");
  const repo = await import("../repositories/userReadingRepository.js");
  const { finishUserReadingService } =
    await import("../services/finishUserReadingService.js");

  let userId: string | null = null;
  let bookId: string | null = null;

  try {
    const suffix = randomUUID();

    const user = await prisma.user.create({
      data: {
        email: "epub-race-" + suffix + "@example.invalid",
        passwordHash: "test-only",
      },
    });
    userId = user.id;

    const book = await prisma.book.create({
      data: {
        isbn: "epub-race-" + suffix,
        title: "EPUB concurrency test",
        author: "Test",
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

    // Scenario 1: two simultaneous finish requests.
    const first = await repo.createUserReadingSession(
      user.id,
      book.id,
      {
        source: "EBOOK",
        progressMode: "PERCENT",
        startPercent: 10,
      },
    );

    const lease1 = first.readerLeaseId;
    if (!lease1) throw new Error("First lease is missing");

    await prisma.readingSession.update({
      where: { id: first.id },
      data: {
        startedAt: new Date(Date.now() - 240000),
        lastHeartbeatAt: new Date(Date.now() - 180000),
        verifiedSeconds: 15,
      },
    });

    const finishFirst = () =>
      finishUserReadingService(user.id, book.id, {
        endPercent: 45,
        readerLeaseId: lease1,
      });

    const parallelFinish = await Promise.allSettled([
      finishFirst(),
      finishFirst(),
    ]);

    const successes = parallelFinish.filter(
      (result) => result.status === "fulfilled",
    );

    const failures = parallelFinish.filter(
      (result) => result.status === "rejected",
    );

    assert.equal(successes.length, 1);
    assert.equal(failures.length, 1);

    const failure = failures[0];

    if (!failure || failure.status !== "rejected") {
      throw new Error("Expected one rejected finish");
    }

    assert.match(
      String(failure.reason?.message ?? failure.reason),
      /No active reading session|Reading session changed/,
    );

    const savedFirst = await prisma.readingSession.findUniqueOrThrow({
      where: { id: first.id },
    });

    assert.ok(savedFirst.finishedAt);
    assert.equal(savedFirst.durationSeconds, 60);
    assert.equal(savedFirst.endPercent, 45);

    console.log("PASS: Only one simultaneous finish succeeds");
    console.log("PASS: Verified reading time is not duplicated");

    const bookAfterFirst = await prisma.userBook.findUniqueOrThrow({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: book.id,
        },
      },
    });

    assert.equal(bookAfterFirst.currentPercent, 45);
    assert.equal(bookAfterFirst.status, "READING");

    console.log("PASS: Concurrent finish preserves book progress");

    // Scenario 2: heartbeat races with finish.
    const second = await repo.createUserReadingSession(
      user.id,
      book.id,
      {
        source: "EBOOK",
        progressMode: "PERCENT",
        startPercent: 45,
      },
    );

    const lease2 = second.readerLeaseId;
    if (!lease2) throw new Error("Second lease is missing");

    await prisma.readingSession.update({
      where: { id: second.id },
      data: {
        startedAt: new Date(Date.now() - 180000),
        lastHeartbeatAt: new Date(Date.now() - 10000),
        verifiedSeconds: 8,
      },
    });

    const finishSecond = () =>
      finishUserReadingService(user.id, book.id, {
        endPercent: 70,
        readerLeaseId: lease2,
      });

    const race = await Promise.allSettled([
      repo.recordUserEbookHeartbeat(
        user.id,
        book.id,
        second.id,
        lease2,
      ),
      finishSecond(),
    ]);

    const heartbeatResult = race[0];
    const finishResult = race[1];

    if (!heartbeatResult || !finishResult) {
      throw new Error("Missing concurrent request result");
    }

    if (heartbeatResult.status === "rejected") {
      assert.match(
        String(heartbeatResult.reason?.message ?? heartbeatResult.reason),
        /No active heartbeat-enabled EPUB session|EPUB heartbeat update conflict/,
      );
    }

    if (finishResult.status === "rejected") {
      assert.match(
        String(finishResult.reason?.message ?? finishResult.reason),
        /Reading session changed; retry finishing/,
      );

      // A heartbeat may win the race. The reader can retry finish.
      await finishSecond();
    }

    const savedSecond = await prisma.readingSession.findUniqueOrThrow({
      where: { id: second.id },
    });

    assert.ok(savedSecond.finishedAt);
    assert.ok(savedSecond.durationSeconds !== null);
    assert.ok(savedSecond.durationSeconds >= 8);
    assert.ok(savedSecond.durationSeconds <= 53);

    console.log("PASS: Heartbeat and finish do not double-count time");

    const savedBook = await prisma.userBook.findUniqueOrThrow({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: book.id,
        },
      },
    });

    assert.equal(savedBook.currentPercent, 70);
    assert.equal(savedBook.status, "READING");

    const finishedCount = await prisma.readingSession.count({
      where: {
        userId: user.id,
        bookId: book.id,
        finishedAt: { not: null },
      },
    });

    const activeCount = await prisma.readingSession.count({
      where: {
        userId: user.id,
        bookId: book.id,
        finishedAt: null,
      },
    });

    assert.equal(finishedCount, 2);
    assert.equal(activeCount, 0);

    console.log("PASS: Exactly two finished sessions, no active duplicates");
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
