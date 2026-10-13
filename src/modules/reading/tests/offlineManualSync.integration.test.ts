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

test("Offline manual sync is idempotent and rejects overlaps", async () => {
  const { default: prisma } = await import("../../../utils/prisma.js");
  const { syncOfflineManualSessionService: sync } =
    await import("../services/syncOfflineManualSessionService.js");
  const { getUserReadingStatsService } =
    await import("../services/getUserReadingStatsService.js");
  const stamp = Date.now();
  const at = (minutesAgo: number) =>
    new Date(stamp - minutesAgo * 60_000).toISOString();

  const suffix = randomUUID();
  const user = await prisma.user.create({
    data: { email: `offline-sync-${suffix}@example.invalid`, passwordHash: "test-only" },
  });
  const book = await prisma.book.create({
    data: { isbn: `offline-sync-${suffix}`, title: "Offline test", author: "Test", pages: 300 },
  });

  try {
    const first = {
      clientSessionId: randomUUID(),
      startedAt: at(14),
      finishedAt: at(12),
      startPage: 10,
      endPage: 14,
      durationSeconds: 100,
    };
    const created = await sync(user.id, book.id, first);
    assert.equal(created.alreadySynced, false);
    assert.equal(created.progressApplied, false);
    assert.equal(created.session.id, first.clientSessionId);

    const replay = await sync(user.id, book.id, first);
    assert.equal(replay.alreadySynced, true);

    await assert.rejects(
      () => sync(user.id, book.id, { ...first, endPage: 15 }),
      (error: any) => error.status === 409,
    );
    await assert.rejects(
      () => sync(user.id, book.id, { ...first, clientSessionId: randomUUID() }),
      (error: any) => error.status === 409,
    );

    const second = {
      clientSessionId: randomUUID(),
      startedAt: at(11),
      finishedAt: at(10),
      startPage: 14,
      endPage: 16,
      durationSeconds: 40,
    };
    await sync(user.id, book.id, second);

    const concurrent = {
      clientSessionId: randomUUID(),
      startedAt: at(9),
      finishedAt: at(8),
      startPage: 16,
      endPage: 17,
      durationSeconds: 50,
    };
    const both = await Promise.all([
      sync(user.id, book.id, concurrent),
      sync(user.id, book.id, concurrent),
    ]);
    assert.equal(both.filter((x) => x.alreadySynced).length, 1);

    const separate = {
      ...concurrent,
      clientSessionId: randomUUID(),
      startedAt: at(7),
      finishedAt: at(6),
      startPage: 17,
      endPage: 18,
    };
    const collisions = await Promise.allSettled([
      sync(user.id, book.id, separate),
      sync(user.id, book.id, { ...separate, clientSessionId: randomUUID() }),
    ]);
    assert.equal(collisions.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal(collisions.filter((x) => x.status === "rejected").length, 1);

    const stats = await getUserReadingStatsService(user.id, book.id);
    assert.equal(stats.sessionsCount, 4);
    assert.equal(stats.totalReadingSeconds, 240);
    assert.equal(await prisma.readingSession.count({ where: { userId: user.id } }), 4);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.book.delete({ where: { id: book.id } });
  }
});
