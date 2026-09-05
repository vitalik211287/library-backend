type ReadingSessionMetricSource = {
  progressMode: "PAGES" | "PERCENT";

  startPage: number;
  endPage: number | null;

  startPercent: number | null;
  endPercent: number | null;

  durationSeconds: number | null;

  startedAt: Date;
};

type FinishedUserBookMetricSource = {
  finishedAt: Date | null;
};

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/* =========================
   TIME ZONE
========================= */

export const getSafeTimeZone = (timeZone?: string) => {
  if (!timeZone) {
    return "UTC";
  }

  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone,
    }).format();

    return timeZone;
  } catch {
    return "UTC";
  }
};

/* =========================
   DATE HELPERS
========================= */

const getDateKey = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;

  const month = parts.find((part) => part.type === "month")?.value;

  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format date");
  }

  return `${year}-${month}-${day}`;
};

const dateKeyToDayNumber = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Invalid date key");
  }

  return Math.floor(Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY);
};

const dayNumberToDateKey = (dayNumber: number) => {
  const date = new Date(dayNumber * MILLISECONDS_PER_DAY);

  const year = date.getUTCFullYear();

  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =========================
   SESSION METRICS
========================= */

export const calculateReadingSessionMetrics = (
  sessions: ReadingSessionMetricSource[],
) => {
  const pages = sessions.reduce((total, session) => {
    if (session.progressMode !== "PAGES" || session.endPage === null) {
      return total;
    }

    return total + Math.max(session.endPage - session.startPage, 0);
  }, 0);

  const percent = sessions.reduce((total, session) => {
    if (session.progressMode !== "PERCENT" || session.endPercent === null) {
      return total;
    }

    const startPercent = session.startPercent ?? 0;

    return total + Math.max(session.endPercent - startPercent, 0);
  }, 0);

  const seconds = sessions.reduce(
    (total, session) => total + Math.max(session.durationSeconds ?? 0, 0),
    0,
  );

  const pageSessions = sessions.filter(
    (session) => session.progressMode === "PAGES",
  );

  const percentSessions = sessions.filter(
    (session) => session.progressMode === "PERCENT",
  );

  const pageReadingSeconds = pageSessions.reduce(
    (total, session) => total + Math.max(session.durationSeconds ?? 0, 0),
    0,
  );

  const averageSessionSeconds =
    sessions.length > 0 ? Math.round(seconds / sessions.length) : 0;

  const pagesPerHour =
    pageReadingSeconds > 0
      ? Math.round(pages / (pageReadingSeconds / 3600))
      : 0;

  return {
    pages,
    percent,
    seconds,

    sessions: sessions.length,
    pageSessions: pageSessions.length,
    percentSessions: percentSessions.length,

    averageSessionSeconds,
    pagesPerHour,
  };
};

/* =========================
   FINISHED BOOKS
========================= */

export const getFinishedBooksInRange = <T extends FinishedUserBookMetricSource>(
  userBooks: T[],
  from: Date,
  to: Date,
) => {
  return userBooks.filter(
    (userBook) =>
      userBook.finishedAt !== null &&
      userBook.finishedAt >= from &&
      userBook.finishedAt < to,
  );
};

/* =========================
   STREAK
========================= */

export const calculateReadingStreak = (dates: Date[], timeZone: string) => {
  if (dates.length === 0) {
    return {
      current: 0,
      longest: 0,
      readToday: false,
    };
  }

  const uniqueDates = [
    ...new Set(dates.map((date) => getDateKey(date, timeZone))),
  ].sort();

  const dateSet = new Set(uniqueDates);

  let longest = 0;
  let running = 0;

  let previousDayNumber: number | null = null;

  for (const dateKey of uniqueDates) {
    const dayNumber = dateKeyToDayNumber(dateKey);

    if (previousDayNumber === null) {
      running = 1;
    } else if (dayNumber === previousDayNumber + 1) {
      running += 1;
    } else {
      running = 1;
    }

    longest = Math.max(longest, running);

    previousDayNumber = dayNumber;
  }

  const todayKey = getDateKey(new Date(), timeZone);

  const todayDayNumber = dateKeyToDayNumber(todayKey);

  const yesterdayKey = dayNumberToDateKey(todayDayNumber - 1);

  const readToday = dateSet.has(todayKey);

  let cursorDayNumber: number | null = readToday
    ? todayDayNumber
    : dateSet.has(yesterdayKey)
      ? todayDayNumber - 1
      : null;

  let current = 0;

  while (cursorDayNumber !== null) {
    const cursorKey = dayNumberToDateKey(cursorDayNumber);

    if (!dateSet.has(cursorKey)) {
      break;
    }

    current += 1;
    cursorDayNumber -= 1;
  }

  return {
    current,
    longest,
    readToday,
  };
};

