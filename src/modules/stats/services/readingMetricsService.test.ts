
import test from "node:test";
import assert from "node:assert/strict";

import { calculateReadingSessionMetrics } from "./readingMetricsService.js";

test("empty history has zero metrics", () => {
  assert.deepEqual(calculateReadingSessionMetrics([]), {
    pages: 0,
    percent: 0,
    seconds: 0,
    sessions: 0,
    pageSessions: 0,
    percentSessions: 0,
    averageSessionSeconds: 0,
    pagesPerHour: 0,
  });
});

test("page and percent sessions are calculated separately", () => {
  const startedAt = new Date("2026-01-01T10:00:00Z");

  const sessions = [
    {
      progressMode: "PAGES" as const,
      startPage: 10,
      endPage: 35,
      startPercent: null,
      endPercent: null,
      durationSeconds: 1800,
      startedAt,
    },
    {
      progressMode: "PAGES" as const,
      startPage: 40,
      endPage: 50,
      startPercent: null,
      endPercent: null,
      durationSeconds: 900,
      startedAt,
    },
    {
      progressMode: "PERCENT" as const,
      startPage: 0,
      endPage: null,
      startPercent: 12,
      endPercent: 25,
      durationSeconds: 3600,
      startedAt,
    },
  ];

  assert.deepEqual(calculateReadingSessionMetrics(sessions), {
    pages: 35,
    percent: 13,
    seconds: 6300,
    sessions: 3,
    pageSessions: 2,
    percentSessions: 1,
    averageSessionSeconds: 2100,
    pagesPerHour: 47,
  });
});
