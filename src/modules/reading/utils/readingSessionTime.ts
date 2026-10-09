export const getTotalPausedSeconds = (
  pausedSeconds: number,
  pausedAt: Date | null,
  now: Date,
): number => {
  const currentPauseSeconds = pausedAt
    ? Math.max(
        Math.floor((now.getTime() - pausedAt.getTime()) / 1000),
        0,
      )
    : 0;

  return pausedSeconds + currentPauseSeconds;
};

export const calculateReadingSessionTime = (
  startedAt: Date,
  pausedAt: Date | null,
  pausedSeconds: number,
  now: Date,
) => {
  const elapsedSeconds = Math.max(
    Math.floor((now.getTime() - startedAt.getTime()) / 1000),
    0,
  );

  const totalPausedSeconds = getTotalPausedSeconds(
    pausedSeconds,
    pausedAt,
    now,
  );

  return {
    durationSeconds: Math.max(elapsedSeconds - totalPausedSeconds, 0),
    pausedSeconds: totalPausedSeconds,
  };
};
