import prisma from "../utils/prisma.js";

export const getUserByEmail = async (
  email: string,
) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const getUserById = async (
  id: string,
) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
};

export const createUser = async (
  data: {
    name?: string;
    email: string;
    passwordHash: string;
  },
) => {
  return prisma.user.create({
    data,
  });
};

export const updateUserName = async (
  userId: string,
  name: string,
) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name,
    },
  });
};

export const updateUserPassword = async (
  userId: string,
  passwordHash: string,
) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash,
    },
  });
};

export const updateUserAvatar = async (
  userId: string,
  avatarUrl: string,
) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      avatarUrl,
    },
  });
};