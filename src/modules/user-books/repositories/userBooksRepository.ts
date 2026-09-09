import prisma from "../../../utils/prisma.js";

import type { Prisma, ProgressMode, ReadingStatus } from "@prisma/client";

type DbClient = Prisma.TransactionClient | typeof prisma;

type UpdateUserBookData = {
  progressMode?: ProgressMode;
  currentPage?: number;
  currentPercent?: number;
  status?: ReadingStatus;
  rating?: number | null;
  isWishlist?: boolean;
};

type UpdateReadingProgressData = {
  progressMode?: ProgressMode;
  currentPage?: number;
  currentPercent?: number;
  status: ReadingStatus;
};

export const getUserBook = async (
  userId: string,
  bookId: string,
  db: DbClient = prisma,
) => {
  return db.userBook.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },

    include: {
      book: true,
    },
  });
};

export const createUserBook = async (userId: string, bookId: string) => {
  return prisma.userBook.create({
    data: {
      userId,
      bookId,
    },

    include: {
      book: true,
    },
  });
};

export const getOrCreateUserBook = async (userId: string, bookId: string) => {
  return prisma.userBook.upsert({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },

    update: {},

    create: {
      userId,
      bookId,
    },

    include: {
      book: true,
    },
  });
};

export const updateUserBook = async (
  userId: string,
  bookId: string,
  data: UpdateUserBookData,
  db: DbClient = prisma,
) => {
  const existingUserBook = await getUserBook(userId, bookId, db);

  const finishedAt =
    data.status === "FINISHED"
      ? (existingUserBook?.finishedAt ?? new Date())
      : data.status !== undefined
        ? null
        : undefined;

  return db.userBook.upsert({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },

    update: {
      ...(data.progressMode !== undefined && {
        progressMode: data.progressMode,
      }),

      ...(data.currentPage !== undefined && {
        currentPage: data.currentPage,
      }),

      ...(data.currentPercent !== undefined && {
        currentPercent: data.currentPercent,
      }),

      ...(data.status !== undefined && {
        status: data.status,
      }),

      ...(data.rating !== undefined && {
        rating: data.rating,
      }),

      ...(data.isWishlist !== undefined && {
        isWishlist: data.isWishlist,
      }),

      ...(finishedAt !== undefined && {
        finishedAt,
      }),
    },

    create: {
      userId,
      bookId,

      ...(data.progressMode !== undefined && {
        progressMode: data.progressMode,
      }),

      ...(data.currentPage !== undefined && {
        currentPage: data.currentPage,
      }),

      ...(data.currentPercent !== undefined && {
        currentPercent: data.currentPercent,
      }),

      ...(data.status !== undefined && {
        status: data.status,
      }),

      ...(data.rating !== undefined && {
        rating: data.rating,
      }),

      ...(data.isWishlist !== undefined && {
        isWishlist: data.isWishlist,
      }),

      ...(finishedAt !== undefined && {
        finishedAt,
      }),
    },

    include: {
      book: true,
    },
  });
};


export const getFinishedUserBooks = async (
  userId: string,
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;

  const [userBooks, total] = await prisma.$transaction([
    prisma.userBook.findMany({
      where: {
        userId,
        status: "FINISHED",
      },

      include: {
        book: true,
      },

      orderBy: [
        {
          finishedAt: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],

      skip,
      take: limit,
    }),

    prisma.userBook.count({
      where: {
        userId,
        status: "FINISHED",
      },
    }),
  ]);

  return {
    userBooks,
    total,
  };
};

export const getWishlistUserBooks = async (userId: string) => {
  return prisma.userBook.findMany({
    where: {
      userId,
      isWishlist: true,
    },

    include: {
      book: true,
    },

    orderBy: {
      updatedAt: "desc",
    },
  });
};



export const getCurrentUserBooks = async (userId: string) => {
  return prisma.userBook.findMany({
    where: {
      userId,

      status: {
        in: ["READING", "PAUSED"],
      },
    },

    include: {
      book: true,
    },

    orderBy: {
      updatedAt: "desc",
    },
  });
};
