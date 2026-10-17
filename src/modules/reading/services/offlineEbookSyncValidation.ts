// EPUB progress uses cumulative reading percentage, not the current CFI position.
// Unlike heartbeat-verified online time, offline time is recorded locally and
// checked for sensible bounds when the connection returns.
export type OfflineEbookSession = {
  clientSessionId: string;
  startedAt: Date;
  finishedAt: Date;
  startPercent: number;
  endPercent: number;
  durationSeconds: number;
  epubStartPositionPercent: number | null;
  epubEndPositionPercent: number | null;
};

export class OfflineEbookSyncError extends Error {
  constructor(message: string, public readonly status: number = 400) {
    super(message);
  }
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UTC_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const percent = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 100;

export const parseOfflineEbookSession = (body: unknown): OfflineEbookSession => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new OfflineEbookSyncError("Invalid offline EPUB session");
  }
  const value = body as Record<string, unknown>;
  if (value.source !== "EBOOK" || value.progressMode !== "PERCENT") {
    throw new OfflineEbookSyncError("Offline EPUB requires EBOOK/PERCENT");
  }
  if (typeof value.clientSessionId !== "string" || !UUID_V4.test(value.clientSessionId)) {
    throw new OfflineEbookSyncError("A version-4 clientSessionId is required");
  }
  if (typeof value.startedAt !== "string" || typeof value.finishedAt !== "string" ||
      !UTC_ISO.test(value.startedAt) || !UTC_ISO.test(value.finishedAt)) {
    throw new OfflineEbookSyncError("UTC ISO timestamps are required");
  }
  const startedAt = new Date(value.startedAt);
  const finishedAt = new Date(value.finishedAt);
  const elapsedMs = finishedAt.getTime() - startedAt.getTime();
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0 ||
      finishedAt.getTime() > Date.now() + 5 * 60_000) {
    throw new OfflineEbookSyncError("Invalid offline session interval");
  }
  if (!percent(value.startPercent) || !percent(value.endPercent) ||
      value.endPercent < value.startPercent) {
    throw new OfflineEbookSyncError("Invalid cumulative EPUB reading percentage");
  }
  if (typeof value.durationSeconds !== "number" ||
      !Number.isSafeInteger(value.durationSeconds) || value.durationSeconds < 1 ||
      value.durationSeconds > 12 * 60 * 60 ||
      value.durationSeconds > Math.ceil(elapsedMs / 1000)) {
    throw new OfflineEbookSyncError("Invalid offline reading duration");
  }
  for (const key of ["epubStartPositionPercent", "epubEndPositionPercent"]) {
    if (value[key] !== undefined && !percent(value[key])) {
      throw new OfflineEbookSyncError("Invalid EPUB navigation position");
    }
  }
  // Completion needs a separate, idempotent persisted signal; never infer
  // a finished book from a seek to the last page.
  if (value.epubReachedEnd !== undefined) {
    throw new OfflineEbookSyncError("Offline EPUB completion is not supported yet");
  }
  return {
    clientSessionId: value.clientSessionId,
    startedAt,
    finishedAt,
    startPercent: value.startPercent,
    endPercent: value.endPercent,
    durationSeconds: value.durationSeconds,
    epubStartPositionPercent: (value.epubStartPositionPercent as number | undefined) ?? null,
    epubEndPositionPercent: (value.epubEndPositionPercent as number | undefined) ?? null,
  };
};
