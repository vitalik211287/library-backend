import prisma from "../../../utils/prisma.js";

export const addPostKudos = async (
  postId: string,
  userId: string,
) => {
  return prisma.postKudos.upsert({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
    update: {},
    create: {
      postId,
      userId,
    },
  });
};

export const removePostKudos = async (
  postId: string,
  userId: string,
) => {
  return prisma.postKudos.deleteMany({
    where: {
      postId,
      userId,
    },
  });
};

export const getPostForKudos = async (postId: string) => {
  return prisma.socialPost.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      authorId: true,
      _count: {
        select: {
          kudos: true,
        },
      },
      kudos: true,
    },
  });
};

export const getPostKudosUsers = async (postId: string) => {
  return prisma.postKudos.findMany({
    where: {
      postId,
    },
    select: {
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
