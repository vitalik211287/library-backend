import prisma from "../utils/prisma.js";

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
