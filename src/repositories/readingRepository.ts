import prisma from "../utils/prisma.js";

export const getBookById = async (bookId: string) => {
  return prisma.book.findUnique({
    where: {
      id: bookId,
    },
  });
};

export const getActiveReadingSession = async (bookId: string) => {
  return prisma.readingSession.findFirst({
    where: {
      bookId,
      finishedAt: null,
    },
  });
};

export const createReadingSession = async (
  bookId: string,
  startPage: number,
) => {
  return prisma.readingSession.create({
    data: {
      bookId,
      startPage,
      startedAt: new Date(),
    },
  });
};

export const setBookAsReading = async (bookId: string) => {
  return prisma.book.update({
    where: {
      id: bookId,
    },
    data: {
      status: "READING",
    },
  });
};


export const setBookAsFinished = async (bookId: string) => {
  return prisma.book.update({
    where: {
      id: bookId,
    },
    data: {
      status: "FINISHED",
    },
  });
};

export const finishReadingSession = async (
  sessionId: string,
  endPage: number,
  durationSeconds: number,
) => {
  return prisma.readingSession.update({
    where: {
      id: sessionId,
    },
    data: {
      endPage,
      finishedAt: new Date(),
      durationSeconds,
    },
  });
};

export const updateBookCurrentPage = async (
  bookId: string,
  currentPage: number,
) => {
  return prisma.book.update({
    where: {
      id: bookId,
    },
    data: {
      currentPage,
    },
  });
};

export const getFinishedReadingSessions = async (bookId: string) => {
  return prisma.readingSession.findMany({
    where: {
      bookId,
      finishedAt: {
        not: null,
      },
    },
    orderBy: {
      startedAt: "asc",
    },
  });
};

export const getAllFinishedReadingSessions = async () => {
  return prisma.readingSession.findMany({
    where: {
      finishedAt: {
        not: null,
      },
    },
    orderBy: {
      startedAt: "asc",
    },
    include: {
      book: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
};

export const updateBookRating = async (
  bookId: string,
  rating: number,
) => {
  return prisma.book.update({
    where: {
      id: bookId,
    },
    data: {
      rating,
    },
  });
};

