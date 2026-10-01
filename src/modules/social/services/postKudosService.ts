import {
  addPostKudos,
  getPostForKudos,
  getPostKudosUsers,
  removePostKudos,
} from "../repositories/postKudosRepository.js";

export const addPostKudosService = async (
  postId: string,
  userId: string,
) => {
  const post = await getPostForKudos(postId);

  if (!post) {
    throw new Error("Post not found");
  }

  if (post.authorId === userId) {
    throw new Error("You cannot give kudos to your own post");
  }

  await addPostKudos(postId, userId);

  const updated = await getPostForKudos(postId);

  return {
    success: true,
    hasKudos: true,
    kudosCount: updated?._count.kudos ?? 0,
  };
};

export const removePostKudosService = async (
  postId: string,
  userId: string,
) => {
  const post = await getPostForKudos(postId);

  if (!post) {
    throw new Error("Post not found");
  }

  await removePostKudos(postId, userId);

  const updated = await getPostForKudos(postId);

  return {
    success: true,
    hasKudos: false,
    kudosCount: updated?._count.kudos ?? 0,
  };
};

export const getPostKudosUsersService = async (
  postId: string,
) => {
  const post = await getPostForKudos(postId);

  if (!post) {
    throw new Error("Post not found");
  }

  const items = await getPostKudosUsers(postId);

  return items.map((item) => ({
    givenAt: item.createdAt,
    id: item.user.id,
    name: item.user.name,
    avatarUrl: item.user.avatarUrl,
  }));
};
