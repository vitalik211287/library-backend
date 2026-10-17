import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { parseOfflineEbookSession } from "./offlineEbookSyncValidation.js";

const payload = () => ({
  source: "EBOOK",
  progressMode: "PERCENT",
  clientSessionId: randomUUID(),
  startedAt: new Date(Date.now() - 120_000).toISOString(),
  finishedAt: new Date(Date.now() - 60_000).toISOString(),
  startPercent: 10,
  endPercent: 12,
  durationSeconds: 40,
  epubStartPositionPercent: 70,
  epubEndPositionPercent: 72,
});

test("offline EPUB accepts independent cumulative and location percentages", () => {
  const parsed = parseOfflineEbookSession(payload());
  assert.equal(parsed.startPercent, 10);
  assert.equal(parsed.endPercent, 12);
  assert.equal(parsed.epubStartPositionPercent, 70);
  assert.equal(parsed.durationSeconds, 40);
});

test("offline EPUB rejects wrong source or progress mode", () => {
  assert.throws(() => parseOfflineEbookSession({ ...payload(), source: "MANUAL" }));
  assert.throws(() => parseOfflineEbookSession({ ...payload(), progressMode: "PAGES" }));
});

test("offline EPUB rejects forged or inconsistent duration", () => {
  assert.throws(() => parseOfflineEbookSession({ ...payload(), durationSeconds: 10000 }));
  assert.throws(() => parseOfflineEbookSession({ ...payload(), durationSeconds: -1 }));
  assert.throws(() => parseOfflineEbookSession({ ...payload(), durationSeconds: 0 }));
});

test("offline EPUB rejects rewound cumulative progress but permits rereading navigation", () => {
  assert.throws(() => parseOfflineEbookSession({ ...payload(), endPercent: 9 }));
  assert.equal(parseOfflineEbookSession({ ...payload(), epubEndPositionPercent: 30 }).epubEndPositionPercent, 30);
});

test("offline EPUB rejects invalid timestamps and navigation", () => {
  assert.throws(() => parseOfflineEbookSession({ ...payload(), finishedAt: "not-a-date" }));
  assert.throws(() => parseOfflineEbookSession({ ...payload(), epubStartPositionPercent: 101 }));
  assert.throws(() => parseOfflineEbookSession({ ...payload(), epubReachedEnd: true }));
});
