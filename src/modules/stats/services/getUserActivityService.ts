import { getUserReadingSessionsForMonth } from "../repositories/userStatsRepository.js";

import { calculateReadingSessionMetrics } from "./readingMetricsService.js";

type DayActivity = {
  day: number;
  seconds: number;
  pages: number;
  percent: number;
  sessions: number;
};

export const getUserActivityService = async (
  userId: string,
  year: number,
  month: number,
) => {
  const from = new Date(Date.UTC(year, month - 1, 1));

  const to = new Date(Date.UTC(year, month, 1));

  const sessions = await getUserReadingSessionsForMonth(userId, from, to);

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const days: DayActivity[] = Array.from(
    {
      length: daysInMonth,
    },
    (_, index) => ({
      day: index + 1,

      seconds: 0,

      pages: 0,

      percent: 0,

      sessions: 0,
    }),
  );

  for (let day = 1; day <= daysInMonth; day += 1) {
    const daySessions = sessions.filter(
      (session) => session.startedAt.getUTCDate() === day,
    );

    const metrics = calculateReadingSessionMetrics(daySessions);

    const dayActivity = days[day - 1];

    if (!dayActivity) {
      continue;
    }

    dayActivity.sessions = metrics.sessions;
    dayActivity.seconds = metrics.seconds;
    dayActivity.pages = metrics.pages;
    dayActivity.percent = metrics.percent;
  }

  return {
    year,
    month,
    days,
  };
};
