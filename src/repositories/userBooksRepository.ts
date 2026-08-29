import prisma from "../utils/prisma.js";

import type { ReadingStatus } from "@prisma/client";

type UpdateUserBookData = {
  currentPage?: number;
  status?: ReadingStatus;
  rating?: number | null;
};

export const getUserBook = async (userId: string, bookId: string) => {
  return prisma.userBook.findUnique({
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
  const existingUserBook = await getUserBook(userId, bookId);

  if (existingUserBook) {
    return existingUserBook;
  }

  return createUserBook(userId, bookId);
};

export const updateUserBook = async (
  userId: string,
  bookId: string,
  data: UpdateUserBookData,
) => {
  const existingUserBook = await getUserBook(userId, bookId);

  const finishedAt =
    data.status === "FINISHED"
      ? (existingUserBook?.finishedAt ?? new Date())
      : data.status !== undefined
        ? null
        : undefined;

  return prisma.userBook.upsert({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },

    update: {
      ...data,

      ...(finishedAt !== undefined && {
        finishedAt,
      }),
    },

    create: {
      userId,
      bookId,

      ...(data.currentPage !== undefined && {
        currentPage: data.currentPage,
      }),

      ...(data.status !== undefined && {
        status: data.status,
      }),

      ...(data.rating !== undefined && {
        rating: data.rating,
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

export const addUserBookToWishlist = async (userId: string, bookId: string) => {
  return prisma.userBook.upsert({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },

    update: {
      isWishlist: true,
    },

    create: {
      userId,
      bookId,
      isWishlist: true,
    },

    include: {
      book: true,
    },
  });
};

export const removeUserBookFromWishlist = async (
  userId: string,
  bookId: string,
) => {
  return prisma.userBook.update({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },

    data: {
      isWishlist: false,
    },

    include: {
      book: true,
    },
  });
};
