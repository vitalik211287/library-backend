import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateVerifiedEbookSeconds,
  MAX_EBOOK_HEARTBEAT_GAP_SECONDS,
} from "./ebookHeartbeatTime.js";

const start = new Date("2026-10-11T10:00:00Z");

const calculate = (
  seconds: number,
  options: {
    verifiedSeconds?: number | null;
    lastHeartbeatAt?: Date | null;
    pausedAt?: Date | null;
  } = {},
) => calculateVerifiedEbookSeconds({
  verifiedSeconds: options.verifiedSeconds === undefined
    ? 120
    : options.verifiedSeconds,
  lastHeartbeatAt: options.lastHeartbeatAt === undefined
    ? start
    : options.lastHeartbeatAt,
  pausedAt: options.pausedAt ?? null,
  now: new Date(start.getTime() + seconds * 1000),
});

test("regular 30-second heartbeat", () => {
  assert.equal(calculate(30), 150);
});

test("small delay is counted", () => {
  assert.equal(calculate(38), 158);
});

test("long outage is capped at 45 seconds", () => {
  assert.equal(calculate(7200), 120 + MAX_EBOOK_HEARTBEAT_GAP_SECONDS);
});

test("paused session accumulates no additional time", () => {
  assert.equal(
    calculate(1800, { pausedAt: start }),
    120,
  );
});

test("legacy session remains unchanged", () => {
  assert.equal(
    calculate(30, { verifiedSeconds: null }),
    null,
  );

  assert.equal(
    calculate(30, { lastHeartbeatAt: null }),
    null,
  );
});

test("future heartbeat timestamp never adds time", () => {
  assert.equal(calculate(-10), 120);
});

test("sub-second durations are rounded down", () => {
  assert.equal(calculate(30.8), 150);
});

test("new session starts with zero confirmed time", () => {
  assert.equal(
    calculate(30, { verifiedSeconds: 0 }),
    30,
  );
});
