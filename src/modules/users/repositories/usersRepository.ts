import prisma from "../../../utils/prisma.js";

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

export const updateUserName = async (userId: string, name: string) => {
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

export const updateUserAvatar = async (userId: string, avatarUrl: string) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      avatarUrl,
    },
  });
};

export const searchUsers = async (currentUserId: string, query: string) => {
  return prisma.user.findMany({
    where: {
      id: {
        not: currentUserId,
      },

      OR: [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },

    select: {
      id: true,
      name: true,
      avatarUrl: true,

      followers: {
        where: {
          followerId: currentUserId,
        },

        select: {
          id: true,
        },
      },

      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },

    orderBy: {
      name: "asc",
    },

    take: 20,
  });
};

export const getPublicUserById = async (
  userId: string,
  currentUserId: string,
) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      avatarUrl: true,
      createdAt: true,

      followers: {
        where: {
          followerId: currentUserId,
        },

        select: {
          id: true,
        },
      },

      _count: {
        select: {
          followers: true,
          following: true,
        },
      },

      books: {
        where: {
          status: {
            in: ["READING", "FINISHED"],
          },
        },

        select: {
          status: true,
          currentPage: true,
          rating: true,
          finishedAt: true,

          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverUrl: true,
              pages: true,
            },
          },
        },

        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });
};

export const followUser = async (followerId: string, followingId: string) => {
  return prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },

    update: {},

    create: {
      followerId,
      followingId,
    },
  });
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  return prisma.follow.deleteMany({
    where: {
      followerId,
      followingId,
    },
  });
};

export const getFollowing = async (userId: string) => {
  return prisma.follow.findMany({
    where: {
      followerId: userId,
    },

    select: {
      createdAt: true,

      following: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,

          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getFollowers = async (userId: string) => {
  return prisma.follow.findMany({
    where: {
      followingId: userId,
    },

    select: {
      createdAt: true,

      follower: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,

          followers: {
            where: {
              followerId: userId,
            },

            select: {
              id: true,
            },
          },

          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};
