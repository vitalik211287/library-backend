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

test("EPUB lease: concurrent claim and heartbeat fencing", async () => {
  const { default: prisma } = await import("../../../utils/prisma.js");
  const repo = await import("../repositories/userReadingRepository.js");
  const claimService = await import("../services/claimUserEbookSessionService.js");

  const suffix = randomUUID();
  let userId: string | null = null;
  let bookId: string | null = null;

  try {
    const user = await prisma.user.create({
      data: {
        email: `epub-${suffix}@example.invalid`,
        passwordHash: "test-only",
      },
    });
    userId = user.id;

    const book = await prisma.book.create({
      data: {
        isbn: `epub-test-${suffix}`,
        title: "EPUB integration test",
        author: "Test",
      },
    });
    bookId = book.id;

    const session = await repo.createUserReadingSession(
      user.id,
      book.id,
      {
        progressMode: "PERCENT",
        source: "EBOOK",
        startPercent: 10,
      },
    );

    assert.equal(session.verifiedSeconds, 0);
    assert.ok(session.readerLeaseId);
    console.log("PASS: EPUB session starts with zero verified time");

    await prisma.readingSession.update({
      where: { id: session.id },
      data: {
        lastHeartbeatAt: new Date(Date.now() - 180000),
      },
    });

    const attempts = await Promise.allSettled([
      repo.claimUserEbookSession(user.id, book.id, session.id),
      repo.claimUserEbookSession(user.id, book.id, session.id),
    ]);

    const winners = attempts.filter(
      (result) => result.status === "fulfilled",
    );

    assert.equal(winners.length, 1);

    const winner = winners[0];

    if (!winner || winner.status !== "fulfilled") {
      throw new Error("Expected exactly one successful EPUB claim");
    }

    const claimed = winner.value;

    assert.notEqual(claimed.readerLeaseId, session.readerLeaseId);
    assert.equal(claimed.session.id, session.id);
    const confirmedSeconds = claimed.session.verifiedSeconds;

    if (confirmedSeconds === null) {
      throw new Error("Confirmed EPUB time is missing");
    }

    assert.ok(confirmedSeconds <= 45);

    console.log("PASS: Only one concurrent claim succeeds");

    await assert.rejects(
      () =>
        repo.recordUserEbookHeartbeat(
          user.id,
          book.id,
          session.id,
          session.readerLeaseId!,
        ),
      /No active heartbeat-enabled EPUB session/,
    );

    console.log("PASS: Previous reader lease is rejected");

    const heartbeat = await repo.recordUserEbookHeartbeat(
      user.id,
      book.id,
      session.id,
      claimed.readerLeaseId,
    );

    assert.ok(heartbeat.verifiedSeconds >= 0);
    assert.ok(heartbeat.verifiedSeconds <= 45);

    console.log("PASS: New reader lease can send heartbeat");

    const paused = await repo.pauseTrackedEbookReadingSession(
      user.id,
      book.id,
      session.id,
      claimed.readerLeaseId,
    );

    assert.ok(paused.pausedAt);

    await prisma.userBook.create({
      data: {
        userId: user.id,
        bookId: book.id,
        progressMode: "PERCENT",
        currentPercent: 10,
        status: "PAUSED",
      },
    });

    // A failed transaction must not transfer the reader lease.
    await assert.rejects(
      () => prisma.$transaction(async (tx) => {
        await repo.claimUserEbookSession(
          user.id,
          book.id,
          session.id,
          tx,
        );

        throw new Error("FORCED_TEST_ROLLBACK");
      }),
      /FORCED_TEST_ROLLBACK/,
    );

    const afterRollback =
      await prisma.readingSession.findUniqueOrThrow({
        where: { id: session.id },
      });

    assert.equal(afterRollback.readerLeaseId, claimed.readerLeaseId);
    assert.ok(afterRollback.pausedAt);

    console.log("PASS: Failed transaction preserves previous reader lease");

    const recovered = await claimService.claimUserEbookSessionService(
      user.id,
      book.id,
      session.id,
    );

    assert.equal(recovered.session.pausedAt, null);
    assert.notEqual(recovered.readerLeaseId, claimed.readerLeaseId);

    console.log("PASS: Paused EPUB session can be reclaimed");

    const savedBook = await prisma.userBook.findUniqueOrThrow({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: book.id,
        },
      },
    });

    assert.equal(savedBook.status, "READING");
    assert.equal(savedBook.progressMode, "PERCENT");

    const savedSession =
      await prisma.readingSession.findUniqueOrThrow({
        where: { id: session.id },
      });

    assert.equal(savedSession.pausedAt, null);
    assert.equal(savedSession.readerLeaseId, recovered.readerLeaseId);

    console.log("PASS: Claim atomically restores book and session");
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
