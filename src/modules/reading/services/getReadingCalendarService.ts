import {
  getDateKey,
  getSafeTimeZone,
  zonedDateTimeToUtc,
} from "../../../utils/timeZone.js";

import { getUserReadingSessionsForPeriod } from "../repositories/readingCalendarRepository.js";

type CalendarBook = {
  id: string;
  title: string;
  coverUrl: string | null;
};

type CalendarDay = {
  date: string;
  durationSeconds: number;
  pagesRead: number;
  percentRead: number;
  sessions: number;
  books: CalendarBook[];
};

export const getReadingCalendarService = async (
  userId: string,
  year: number,
  month: number,
  timeZone?: string,
) => {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid year or month");
  }

  const safeTimeZone = getSafeTimeZone(timeZone);

  const startDate = zonedDateTimeToUtc(
    year,
    month,
    1,
    safeTimeZone,
  );

  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  const endDate = zonedDateTimeToUtc(
    nextMonthYear,
    nextMonth,
    1,
    safeTimeZone,
  );

  const sessions = await getUserReadingSessionsForPeriod(
    userId,
    startDate,
    endDate,
  );

  const daysMap = new Map<string, CalendarDay>();

  for (const session of sessions) {
    const date = getDateKey(
      session.startedAt,
      safeTimeZone,
    );

    const existing = daysMap.get(date) ?? {
      date,
      durationSeconds: 0,
      pagesRead: 0,
      percentRead: 0,
      sessions: 0,
      books: [],
    };

    existing.sessions += 1;

    existing.durationSeconds += Math.max(session.durationSeconds ?? 0, 0);

    if (session.progressMode === "PAGES" && session.endPage !== null) {
      existing.pagesRead += Math.max(session.endPage - session.startPage, 0);
    }

    if (session.progressMode === "PERCENT" && session.endPercent !== null) {
      const startPercent = session.startPercent ?? 0;

      existing.percentRead += Math.max(session.endPercent - startPercent, 0);
    }

    const hasBook = existing.books.some((book) => book.id === session.book.id);

    if (!hasBook) {
      existing.books.push({
        id: session.book.id,
        title: session.book.title,
        coverUrl: session.book.coverUrl,
      });
    }

    daysMap.set(date, existing);
  }

  const days = Array.from(daysMap.values());

  const uniqueBookIds = new Set(
    days.flatMap((day) => day.books.map((book) => book.id)),
  );

  return {
    year,
    month,
    booksCount: uniqueBookIds.size,
    days,
  };
};



