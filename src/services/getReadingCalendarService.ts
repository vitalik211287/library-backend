import { getUserReadingSessionsForPeriod } from "../repositories/readingCalendarRepository.js";

export const getReadingCalendarService = async (
  userId: string,
  year: number,
  month: number,
) => {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid year or month");
  }

  const startDate = new Date(
    Date.UTC(year, month - 1, 1),
  );

  const endDate = new Date(
    Date.UTC(year, month, 1),
  );

  const sessions =
    await getUserReadingSessionsForPeriod(
      userId,
      startDate,
      endDate,
    );

  const daysMap = new Map();

  for (const session of sessions) {
    const date =
      session.startedAt
        .toISOString()
        .slice(0, 10);

    const existing = daysMap.get(date) ?? {
      date,
      durationSeconds: 0,
      pagesRead: 0,
      books: [],
    };

    existing.durationSeconds +=
      session.durationSeconds ?? 0;

    if (session.endPage !== null) {
      existing.pagesRead += Math.max(
        session.endPage -
          session.startPage,
        0,
      );
    }

    const hasBook =
      existing.books.some(
        (book: { id: string }) =>
          book.id === session.book.id,
      );

    if (!hasBook) {
      existing.books.push({
        id: session.book.id,
        title: session.book.title,
        coverUrl:
          session.book.coverUrl,
      });
    }

    daysMap.set(date, existing);
  }

  const days = Array.from(
    daysMap.values(),
  );

  const uniqueBookIds = new Set(
    days.flatMap((day) =>
      day.books.map(
        (book: { id: string }) =>
          book.id,
      ),
    ),
  );

  return {
    year,
    month,
    booksCount: uniqueBookIds.size,
    days,
  };
};