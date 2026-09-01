import prisma from "../utils/prisma.js";

import type { Prisma } from "@prisma/client";

export const createLibraryForUser = async (
  userId: string,
  name = "Домашня бібліотека",
) => {
  return prisma.library.create({
    data: {
      name,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
    include: {
      members: true,
    },
  });
};

export const getUserLibraries = async (userId: string) => {
  return prisma.library.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          books: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const getLibraryMembership = async (
  libraryId: string,
  userId: string,
) => {
  return prisma.libraryMember.findUnique({
    where: {
      libraryId_userId: {
        libraryId,
        userId,
      },
    },
  });
};

export const createLibrary = async (userId: string, name: string) => {
  return prisma.library.create({
    data: {
      name,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
    include: {
      members: true,
    },
  });
};

export const addLibraryMember = async (libraryId: string, userId: string) => {
  return prisma.libraryMember.create({
    data: {
      libraryId,
      userId,
      role: "MEMBER",
    },
  });
};

export const getLibraryBooks = async (libraryId: string) => {
  return prisma.libraryBook.findMany({
    where: {
      libraryId,
    },
    include: {
      book: true,
    },
    orderBy: {
      addedAt: "desc",
    },
  });
};

export const createBookInLibrary = async (
  libraryId: string,
  data: Prisma.BookCreateInput,
) => {
  return prisma.$transaction(async (tx) => {
    const book = await tx.book.create({
      data,
    });

    await tx.libraryBook.create({
      data: {
        libraryId,
        bookId: book.id,
      },
    });

    return book;
  });
};
