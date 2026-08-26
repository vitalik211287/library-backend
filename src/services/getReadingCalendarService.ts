import { getAllFinishedReadingSessions } from "../repositories/readingRepository.js";

export const getReadingCalendarService = async () => {
  const sessions = await getAllFinishedReadingSessions();

  const calendar = sessions.reduce<
    Record<
      string,
      {
        date: string;
        totalReadingSeconds: number;
        pagesRead: number;
        sessionsCount: number;
      }
    >
  >((acc, session) => {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Kyiv",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(session.startedAt);

    if (!acc[date]) {
      acc[date] = {
        date,
        totalReadingSeconds: 0,
        pagesRead: 0,
        sessionsCount: 0,
      };
    }

    acc[date].totalReadingSeconds += session.durationSeconds ?? 0;

    if (session.endPage !== null) {
      acc[date].pagesRead += session.endPage - session.startPage;
    }

    acc[date].sessionsCount += 1;

    return acc;
  }, {});

  return Object.values(calendar);
};
