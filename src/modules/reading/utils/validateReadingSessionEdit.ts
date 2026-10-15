type SessionTimeEdit = {
  startedAt?: string;
  durationSeconds?: number;
};

export const validateReadingSessionEdit = (
  currentStartedAt: Date,
  currentDurationSeconds: number | null,
  data: SessionTimeEdit,
) => {
  const startedAt =
    data.startedAt === undefined
      ? currentStartedAt
      : new Date(data.startedAt);

  const durationSeconds =
    data.durationSeconds ?? currentDurationSeconds;

  if (Number.isNaN(startedAt.getTime())) {
    throw new Error("Invalid session date");
  }

  if (
    durationSeconds === null ||
    !Number.isInteger(durationSeconds) ||
    durationSeconds <= 0
  ) {
    throw new Error("Invalid session duration");
  }

  const finishedAt = new Date(
    startedAt.getTime() + durationSeconds * 1000,
  );

  if (
    !Number.isFinite(finishedAt.getTime()) ||
    finishedAt.getTime() > Date.now()
  ) {
    throw new Error("Session cannot finish in the future");
  }

  return {
    startedAt,
    finishedAt,
    durationSeconds,
  };
};
