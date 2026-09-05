import prisma from "../../../utils/prisma.js";

export const getLibraryBookOverridesByBookIds = async (
  libraryId: string,
  bookIds: string[],
) => {
  if (bookIds.length === 0) {
    return [];
  }

  return prisma.libraryBook.findMany({
    where: {
      libraryId,

      bookId: {
        in: bookIds,
      },
    },
  });
};

export const getAccessibleLibraryBooksByBookIds = async (
  userId: string,
  bookIds: string[],
) => {
  if (bookIds.length === 0) {
    return [];
  }

  return prisma.libraryBook.findMany({
    where: {
      bookId: {
        in: bookIds,
      },

      library: {
        members: {
          some: {
            userId,
          },
        },
      },
    },

    include: {
      library: {
        select: {
          id: true,
          name: true,
        },
      },
    },

    orderBy: {
      addedAt: "asc",
    },
  });
};

export const getActiveReadingSessionsForBooks = async (
  userId: string,
  bookIds: string[],
) => {
  if (bookIds.length === 0) {
    return [];
  }

  return prisma.readingSession.findMany({
    where: {
      userId,

      bookId: {
        in: bookIds,
      },

      finishedAt: null,
    },

    orderBy: {
      startedAt: "desc",
    },
  });
};
