import { getUserReadingSessionsForMonth } from "../repositories/userStatsRepository.js";

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

  for (const session of sessions) {
    const day = session.startedAt.getUTCDate();

    const dayActivity = days[day - 1];

    if (!dayActivity) {
      continue;
    }

    dayActivity.sessions += 1;

    dayActivity.seconds += Math.max(session.durationSeconds ?? 0, 0);

    if (session.progressMode === "PAGES" && session.endPage !== null) {
      dayActivity.pages += Math.max(session.endPage - session.startPage, 0);
    }

    if (session.progressMode === "PERCENT" && session.endPercent !== null) {
      const startPercent = session.startPercent ?? 0;

      dayActivity.percent += Math.max(session.endPercent - startPercent, 0);
    }
  }

  return {
    year,
    month,
    days,
  };
};
