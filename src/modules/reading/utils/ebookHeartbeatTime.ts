/**
 * Maximum duration credited between two EPUB activity confirmations.
 * The frontend will normally send a heartbeat every 30 seconds.
 * Longer network/power interruptions must not accumulate indefinitely.
 */
export const MAX_EBOOK_HEARTBEAT_GAP_SECONDS = 45;

type EbookHeartbeatTimeInput = {
  verifiedSeconds: number | null;
  lastHeartbeatAt: Date | null;
  pausedAt: Date | null;
  now: Date;
};

/**
 * Return null for legacy sessions that have not enabled heartbeat tracking.
 * This preserves their existing duration calculation.
 */
export const calculateVerifiedEbookSeconds = ({
  verifiedSeconds,
  lastHeartbeatAt,
  pausedAt,
  now,
}: EbookHeartbeatTimeInput): number | null => {
  if (
    verifiedSeconds === null ||
    !Number.isSafeInteger(verifiedSeconds) ||
    verifiedSeconds < 0 ||
    !lastHeartbeatAt ||
    !Number.isFinite(lastHeartbeatAt.getTime())
  ) {
    return null;
  }

  if (pausedAt || !Number.isFinite(now.getTime())) {
    return verifiedSeconds;
  }

  const elapsedSeconds = Math.floor(
    (now.getTime() - lastHeartbeatAt.getTime()) / 1000,
  );

  const confirmedSeconds = Math.min(
    MAX_EBOOK_HEARTBEAT_GAP_SECONDS,
    Math.max(0, elapsedSeconds),
  );

  return verifiedSeconds + confirmedSeconds;
};
