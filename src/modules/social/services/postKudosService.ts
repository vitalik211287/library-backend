import {
  addPostKudos,
  getPostForKudos,
  getPostKudosUsers,
  removePostKudos,
} from "../repositories/postKudosRepository.js";

import { createPostKudosNotificationService } from "../../notifications/services/notificationsService.js";
import { emitPostKudosUpdated } from "../../../realtime/socket.js";

export const addPostKudosService = async (postId: string, userId: string) => {
  const post = await getPostForKudos(postId);

  if (!post) {
    throw new Error("Post not found");
  }

  if (post.authorId === userId) {
    throw new Error("You cannot give kudos to your own post");
  }

  await addPostKudos(postId, userId);

  await createPostKudosNotificationService({
    recipientUserId: post.authorId,
    actorUserId: userId,
    postId,
  });

  const updated = await getPostForKudos(postId);
  const kudosCount = updated?._count.kudos ?? 0;

  emitPostKudosUpdated(postId, kudosCount);

  return {
    success: true,
    hasKudos: true,
    kudosCount,
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
  const kudosCount = updated?._count.kudos ?? 0;

  emitPostKudosUpdated(postId, kudosCount);

  return {
    success: true,
    hasKudos: false,
    kudosCount,
  };
};

export const getPostKudosUsersService = async (postId: string) => {
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
