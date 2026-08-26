import prisma from "../utils/prisma.js";

export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
};

export const createUser = async (data: {
  name?: string;
  email: string;
  passwordHash: string;
}) => {
  return prisma.user.create({
    data,
  });
};