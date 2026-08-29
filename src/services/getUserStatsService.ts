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

const normalizeDate = (date: Date) => {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
};

const getDateKey = (date: Date) => {
  return [
    date.getUTCFullYear(),
    String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0"),
    String(
      date.getUTCDate(),
    ).padStart(2, "0"),
  ].join("-");
};

const getPreviousDay = (
  date: Date,
) => {
  const previous =
    new Date(date);

  previous.setUTCDate(
    previous.getUTCDate() - 1,
  );

  return previous;
};

const calculateStreak = (
  dates: Date[],
) => {
  if (dates.length === 0) {
    return {
      current: 0,
      longest: 0,
      readToday: false,
    };
  }

  const uniqueDates = [
    ...new Set(
      dates.map(getDateKey),
    ),
  ].sort();

  const dateSet =
    new Set(uniqueDates);

  let longest = 0;
  let running = 0;
  let previousDate:
    Date | null = null;

  for (
    const dateKey of uniqueDates
  ) {
    const date =
      normalizeDate(
        new Date(
          `${dateKey}T00:00:00.000Z`,
        ),
      );

    if (!previousDate) {
      running = 1;
    } else {
      const expectedDate =
        new Date(previousDate);

      expectedDate.setUTCDate(
        expectedDate.getUTCDate() +
          1,
      );

      if (
        getDateKey(
          expectedDate,
        ) === dateKey
      ) {
        running += 1;
      } else {
        running = 1;
      }
    }

    longest =
      Math.max(
        longest,
        running,
      );

    previousDate = date;
  }

  const today =
    normalizeDate(new Date());

  const todayKey =
    getDateKey(today);

  const yesterdayKey =
    getDateKey(
      getPreviousDay(today),
    );

  const readToday =
    dateSet.has(todayKey);

  let current = 0;

  let cursor =
    readToday
      ? today
      : dateSet.has(
            yesterdayKey,
          )
        ? getPreviousDay(
            today,
          )
        : null;

  while (
    cursor &&
    dateSet.has(
      getDateKey(cursor),
    )
  ) {
    current += 1;

    cursor =
      getPreviousDay(cursor);
  }

  return {
    current,
    longest,
    readToday,
  };
};

export const getUserStatsService =
  async (
    userId: string,
    year: number,
  ) => {
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
        (total, session) => {
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
        (total, session) =>
          total +
          Math.max(
            session.durationSeconds ??
              0,
            0,
          ),
        0,
      );

    /* =========================
       FINISHED BOOKS IN YEAR

       We consider the book
       finished when a session
       reaches the last page.
    ========================= */

    const finishedBookIds =
      new Set<string>();

    for (
      const session of yearSessions
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
      const session of yearSessions
    ) {
      const month =
        session.startedAt.getUTCMonth();

      const monthStat =
        months[month];

      if (!monthStat) {
        continue;
      }

      if (
        session.endPage !== null
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
          .get(month + 1)
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

       Genres use all currently
       finished user books.
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
              totalGenreBooks >
              0
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