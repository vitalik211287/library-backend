import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateReadingSessionTime,
  getTotalPausedSeconds,
} from "./readingSessionTime.js";

const start = new Date("2026-01-01T10:00:00Z");
const finish = new Date("2026-01-01T10:30:00Z");

test("reading without pauses", () => {
  assert.deepEqual(
    calculateReadingSessionTime(start, null, 0, finish),
    { durationSeconds: 1800, pausedSeconds: 0 },
  );
});

test("finishing while paused", () => {
  const pausedAt = new Date("2026-01-01T10:10:00Z");

  assert.deepEqual(
    calculateReadingSessionTime(start, pausedAt, 0, finish),
    { durationSeconds: 600, pausedSeconds: 1200 },
  );
});

test("previously accumulated pauses", () => {
  assert.deepEqual(
    calculateReadingSessionTime(start, null, 480, finish),
    { durationSeconds: 1320, pausedSeconds: 480 },
  );
});

test("resuming adds the current pause", () => {
  const pausedAt = new Date("2026-01-01T10:20:00Z");

  assert.equal(getTotalPausedSeconds(300, pausedAt, finish), 900);
});

test("future pause timestamp does not subtract time", () => {
  const pausedAt = new Date("2026-01-01T10:40:00Z");

  assert.equal(getTotalPausedSeconds(120, pausedAt, finish), 120);
});
