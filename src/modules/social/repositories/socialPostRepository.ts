import prisma from "../../../utils/prisma.js";

type CreateSocialPostData = {
  authorId: string;
  text: string;
  bookId?: string | null;
  parentId?: string | null;
  activityId?: string | null;
};

export const createSocialPost = async (data: CreateSocialPostData) => {
  return prisma.socialPost.create({
    data: {
      authorId: data.authorId,
      text: data.text,
      bookId: data.bookId ?? null,
      parentId: data.parentId ?? null,
      activityId: data.activityId ?? null,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      book: {
        select: {
          id: true,
          isbn: true,
          title: true,
          author: true,
          coverUrl: true,
        },
      },
      _count: {
        select: {
          replies: true,
        },
      },
    },
  });
};

export const getSocialPostById = async (postId: string) => {
  return prisma.socialPost.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      authorId: true,
      parentId: true,
      activityId: true,
    },
  });
};

export const getSocialPostRoot = async (postId: string) => {
  let post = await getSocialPostById(postId);

  if (!post) {
    return null;
  }

  while (post.parentId) {
    const parent = await getSocialPostById(post.parentId);

    if (!parent) {
      break;
    }

    post = parent;
  }

  return post;
};

export const getSocialActivityComments = async (activityId: string) => {
  return prisma.socialPost.findMany({
    where: {
      activityId,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      book: {
        select: {
          id: true,
          isbn: true,
          title: true,
          author: true,
          coverUrl: true,
        },
      },
    },
  });
};

export const getSocialPostDescendants = async (postId: string) => {
  const descendants = [];
  let parentIds = [postId];

  while (parentIds.length > 0) {
    const replies = await prisma.socialPost.findMany({
      where: {
        parentId: {
          in: parentIds,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        book: {
          select: {
            id: true,
            isbn: true,
            title: true,
            author: true,
            coverUrl: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (replies.length === 0) {
      break;
    }

    descendants.push(...replies);
    parentIds = replies.map((reply) => reply.id);
  }

  return descendants;
};

export const countSocialPostDescendants = async (postId: string) => {
  const descendants = await getSocialPostDescendants(postId);

  return descendants.length;
};

export const getSocialPostThreadById = async (postId: string) => {
  return prisma.socialPost.findUnique({
    where: {
      id: postId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      book: {
        select: {
          id: true,
          isbn: true,
          title: true,
          author: true,
          coverUrl: true,
        },
      },
      replies: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          book: {
            select: {
              id: true,
              isbn: true,
              title: true,
              author: true,
              coverUrl: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      },
      _count: {
        select: {
          replies: true,
        },
      },
    },
  });
};

type UpdateSocialPostData = {
  text: string;
  bookId?: string | null;
};

export const updateSocialPost = async (
  postId: string,
  data: UpdateSocialPostData,
) => {
  return prisma.socialPost.update({
    where: {
      id: postId,
    },
    data: {
      text: data.text,
      bookId: data.bookId ?? null,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      book: {
        select: {
          id: true,
          isbn: true,
          title: true,
          author: true,
          coverUrl: true,
        },
      },
      _count: {
        select: {
          replies: true,
          kudos: true,
        },
      },
    },
  });
};

export const deleteSocialPost = async (postId: string) => {
  return prisma.socialPost.delete({
    where: {
      id: postId,
    },
  });
};