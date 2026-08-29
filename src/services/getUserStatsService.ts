import {
  getAllUserReadingSessionsForStats,
  getFinishedUserBooksForStats,
  getUserReadingSessionsForStats,
} from "../repositories/userStatsRepository.js";

type GenreStat = {
  name: string;
  books: number;
  percent: number;
};

type AuthorStat = {
  name: string;
  books: number;
};

type MonthStat = {
  month: number;
  books: number;
  pages: number;
  seconds: number;
};

const MILLISECONDS_PER_DAY =
  24 * 60 * 60 * 1000;

/* =========================
   TIME ZONE
========================= */

const getSafeTimeZone = (
  timeZone?: string,
) => {
  if (!timeZone) {
    return "UTC";
  }

  try {
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone,
      },
    ).format();

    return timeZone;
  } catch {
    return "UTC";
  }
};

/* =========================
   DATE HELPERS
========================= */

const getDateKey = (
  date: Date,
  timeZone: string,
) => {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(date);

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day",
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    throw new Error(
      "Failed to format date",
    );
  }

  return `${year}-${month}-${day}`;
};

const dateKeyToDayNumber = (
  dateKey: string,
) => {
  const [
    year,
    month,
    day,
  ] = dateKey
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    throw new Error(
      "Invalid date key",
    );
  }

  return Math.floor(
    Date.UTC(
      year,
      month - 1,
      day,
    ) / MILLISECONDS_PER_DAY,
  );
};

const dayNumberToDateKey = (
  dayNumber: number,
) => {
  const date =
    new Date(
      dayNumber *
        MILLISECONDS_PER_DAY,
    );

  const year =
    date.getUTCFullYear();

  const month =
    String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getUTCDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =========================
   STREAK
========================= */

const calculateStreak = (
  dates: Date[],
  timeZone: string,
) => {
  if (dates.length === 0) {
    return {
      current: 0,
      longest: 0,
      readToday: false,
    };
  }

  /*
   * Кожну reading session
   * перетворюємо на локальний
   * календарний день користувача.
   *
   * Кілька сесій за один день
   * рахуються як один активний день.
   */
  const uniqueDates = [
    ...new Set(
      dates.map(
        (date) =>
          getDateKey(
            date,
            timeZone,
          ),
      ),
    ),
  ].sort();

  const dateSet =
    new Set(uniqueDates);

  /* =========================
     LONGEST STREAK
  ========================= */

  let longest = 0;
  let running = 0;

  let previousDayNumber:
    number | null = null;

  for (
    const dateKey of uniqueDates
  ) {
    const dayNumber =
      dateKeyToDayNumber(
        dateKey,
      );

    if (
      previousDayNumber ===
      null
    ) {
      running = 1;
    } else if (
      dayNumber ===
      previousDayNumber + 1
    ) {
      running += 1;
    } else {
      running = 1;
    }

    longest =
      Math.max(
        longest,
        running,
      );

    previousDayNumber =
      dayNumber;
  }

  /* =========================
     CURRENT STREAK
  ========================= */

  const todayKey =
    getDateKey(
      new Date(),
      timeZone,
    );

  const todayDayNumber =
    dateKeyToDayNumber(
      todayKey,
    );

  const yesterdayKey =
    dayNumberToDateKey(
      todayDayNumber - 1,
    );

  const readToday =
    dateSet.has(
      todayKey,
    );

  /*
   * Якщо читали сьогодні —
   * рахуємо streak від сьогодні.
   *
   * Якщо сьогодні ще не читали,
   * але читали вчора —
   * streak ще активний.
   *
   * Якщо немає читання ні
   * сьогодні, ні вчора —
   * current = 0.
   */
  let cursorDayNumber:
    number | null =
    readToday
      ? todayDayNumber
      : dateSet.has(
            yesterdayKey,
          )
        ? todayDayNumber - 1
        : null;

  let current = 0;

  while (
    cursorDayNumber !== null
  ) {
    const cursorKey =
      dayNumberToDateKey(
        cursorDayNumber,
      );

    if (
      !dateSet.has(
        cursorKey,
      )
    ) {
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

/* =========================
   USER STATS
========================= */

export const getUserStatsService =
  async (
    userId: string,
    year: number,
    timeZone?: string,
  ) => {
    const safeTimeZone =
      getSafeTimeZone(
        timeZone,
      );

    const from =
      new Date(
        Date.UTC(
          year,
          0,
          1,
        ),
      );

    const to =
      new Date(
        Date.UTC(
          year + 1,
          0,
          1,
        ),
      );

    const [
      yearSessions,
      allSessions,
      finishedUserBooks,
    ] = await Promise.all([
      getUserReadingSessionsForStats(
        userId,
        from,
        to,
      ),

      getAllUserReadingSessionsForStats(
        userId,
      ),

      getFinishedUserBooksForStats(
        userId,
      ),
    ]);

    /* =========================
       SUMMARY
    ========================= */

    const pagesRead =
      yearSessions.reduce(
        (
          total,
          session,
        ) => {
          if (
            session.endPage ===
            null
          ) {
            return total;
          }

          return (
            total +
            Math.max(
              session.endPage -
                session.startPage,
              0,
            )
          );
        },
        0,
      );

    const readingSeconds =
      yearSessions.reduce(
        (
          total,
          session,
        ) =>
          total +
          Math.max(
            session.durationSeconds ??
              0,
            0,
          ),
        0,
      );

    /* =========================
       FINISHED BOOKS
    ========================= */

    const finishedBookIds =
      new Set<string>();

    for (
      const session of
        yearSessions
    ) {
      const totalPages =
        session.book.pages;

      const endPage =
        session.endPage;

      if (
        totalPages &&
        endPage !== null &&
        endPage >= totalPages
      ) {
        finishedBookIds.add(
          session.bookId,
        );
      }
    }

    const finishedBooks =
      finishedBookIds.size;

    /* =========================
       AVERAGE RATING
    ========================= */

    const ratings =
      finishedUserBooks
        .map(
          (item) =>
            item.rating,
        )
        .filter(
          (
            rating,
          ): rating is number =>
            typeof rating ===
            "number",
        );

    const averageRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce(
              (
                total,
                rating,
              ) =>
                total +
                rating,
              0,
            ) /
              ratings.length) *
              10,
          ) / 10
        : 0;

    /* =========================
       MONTHS
    ========================= */

    const months:
      MonthStat[] =
      Array.from(
        {
          length: 12,
        },
        (
          _,
          index,
        ) => ({
          month:
            index + 1,
          books: 0,
          pages: 0,
          seconds: 0,
        }),
      );

    const finishedBooksByMonth =
      new Map<
        number,
        Set<string>
      >();

    for (
      let month = 1;
      month <= 12;
      month += 1
    ) {
      finishedBooksByMonth.set(
        month,
        new Set(),
      );
    }

    for (
      const session of
        yearSessions
    ) {
      const month =
        session.startedAt
          .getUTCMonth();

      const monthStat =
        months[month];

      if (!monthStat) {
        continue;
      }

      if (
        session.endPage !==
        null
      ) {
        monthStat.pages +=
          Math.max(
            session.endPage -
              session.startPage,
            0,
          );
      }

      monthStat.seconds +=
        Math.max(
          session.durationSeconds ??
            0,
          0,
        );

      const totalPages =
        session.book.pages;

      if (
        totalPages &&
        session.endPage !==
          null &&
        session.endPage >=
          totalPages
      ) {
        finishedBooksByMonth
          .get(
            month + 1,
          )
          ?.add(
            session.bookId,
          );
      }
    }

    for (
      const month of months
    ) {
      month.books =
        finishedBooksByMonth.get(
          month.month,
        )?.size ?? 0;
    }

    /* =========================
       GENRES
    ========================= */

    const genreMap =
      new Map<
        string,
        number
      >();

    for (
      const item of
        finishedUserBooks
    ) {
      const genre =
        item.book.genre
          ?.trim() ||
        "Без жанру";

      genreMap.set(
        genre,
        (genreMap.get(
          genre,
        ) ?? 0) + 1,
      );
    }

    const totalGenreBooks =
      finishedUserBooks.length;

    const genres:
      GenreStat[] =
      Array.from(
        genreMap.entries(),
      )
        .map(
          ([
            name,
            books,
          ]) => ({
            name,
            books,

            percent:
              totalGenreBooks > 0
                ? Math.round(
                    (books /
                      totalGenreBooks) *
                      100,
                  )
                : 0,
          }),
        )
        .sort(
          (a, b) =>
            b.books -
            a.books,
        );

    /* =========================
       AUTHORS
    ========================= */

    const authorMap =
      new Map<
        string,
        number
      >();

    for (
      const item of
        finishedUserBooks
    ) {
      const author =
        item.book.author
          ?.trim();

      if (!author) {
        continue;
      }

      authorMap.set(
        author,
        (authorMap.get(
          author,
        ) ?? 0) + 1,
      );
    }

    const authors:
      AuthorStat[] =
      Array.from(
        authorMap.entries(),
      )
        .map(
          ([
            name,
            books,
          ]) => ({
            name,
            books,
          }),
        )
        .sort(
          (a, b) =>
            b.books -
            a.books,
        )
        .slice(0, 10);

    /* =========================
       STREAK
    ========================= */

    const activityDates =
      allSessions.map(
        (session) =>
          session.startedAt,
      );

    const streak =
      calculateStreak(
        activityDates,
        safeTimeZone,
      );

    /* =========================
       SESSION COUNT
    ========================= */

    const sessions =
      yearSessions.length;

    /* =========================
       AVERAGES
    ========================= */

    const averageSessionSeconds =
      sessions > 0
        ? Math.round(
            readingSeconds /
              sessions,
          )
        : 0;

    const pagesPerHour =
      readingSeconds > 0
        ? Math.round(
            pagesRead /
              (readingSeconds /
                3600),
          )
        : 0;

    /* =========================
       RESULT
    ========================= */

    return {
      year,

      summary: {
        finishedBooks,
        pagesRead,
        readingSeconds,
        averageRating,
        sessions,
        averageSessionSeconds,
        pagesPerHour,
      },

      streak,

      genres,

      authors,

      months,
    };
  };