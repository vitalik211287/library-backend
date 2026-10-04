import { getBookById } from "../../books/repositories/booksRepository.js";

import {
  createSocialPost,
  deleteSocialPost,
  getSocialActivityComments,
  getSocialPostById,
  getSocialPostDescendants,
  getSocialPostRoot,
  getSocialPostThreadById,
  updateSocialPost,
} from "../repositories/socialPostRepository.js";
import { getSocialActivityById } from "../repositories/socialFeedRepository.js";
import { createPostCommentNotificationService } from "../../notifications/services/notificationsService.js";

const MAX_POST_LENGTH = 1000;

type CreateSocialPostInput = {
  authorId: string;
  text: string;
  bookId?: string | null;
  parentId?: string | null;
  activityId?: string | null;
};

export const createSocialPostService = async ({
  authorId,
  text,
  bookId = null,
  parentId = null,
  activityId = null,
}: CreateSocialPostInput) => {
  const normalizedText = text?.trim();

  if (!normalizedText) {
    throw new Error("Текст допису не може бути порожнім");
  }

  if (normalizedText.length > MAX_POST_LENGTH) {
    throw new Error(
      `Текст допису не може перевищувати ${MAX_POST_LENGTH} символів`,
    );
  }

  if (bookId) {
    const book = await getBookById(bookId);

    if (!book) {
      throw new Error("Книгу не знайдено");
    }
  }

  let resolvedActivityId = activityId;

  if (parentId) {
    const parentPost = await getSocialPostById(parentId);

    if (!parentPost) {
      throw new Error("Батьківський допис не знайдено");
    }

    resolvedActivityId = parentPost.activityId ?? null;
  } else if (activityId) {
    const activity = await getSocialActivityById(activityId);

    if (!activity) {
      throw new Error("Активність не знайдено");
    }
  }

  const post = await createSocialPost({
    authorId,
    text: normalizedText,
    bookId,
    parentId,
    activityId: resolvedActivityId,
  });

  if (parentId && !resolvedActivityId) {
    const parentPost = await getSocialPostById(parentId);
    const rootPost = await getSocialPostRoot(parentId);

    if (parentPost && rootPost) {
      await createPostCommentNotificationService({
        recipientUserId: parentPost.authorId,
        actorUserId: authorId,
        postId: rootPost.id,
      });
    }
  }

  return post;
};

export const getSocialActivityThreadService = async (
  activityId: string,
  userId: string,
) => {
  const activity = await getSocialActivityById(activityId);

  if (!activity) {
    throw new Error("Активність не знайдено");
  }

  const comments = await getSocialActivityComments(activityId);

  return {
    activityId,
    comments: comments.map((comment) => ({
      ...comment,
      isOwnPost: comment.authorId === userId,
    })),
  };
};

export const getSocialPostThreadService = async (postId: string) => {
  const post = await getSocialPostThreadById(postId);

  if (!post) {
    throw new Error("Допис не знайдено");
  }

  const replies = await getSocialPostDescendants(postId);

  return {
    ...post,
    replies,
  };
};

type UpdateSocialPostInput = {
  postId: string;
  userId: string;
  text: string;
  bookId?: string | null;
};

export const updateSocialPostService = async ({
  postId,
  userId,
  text,
  bookId = null,
}: UpdateSocialPostInput) => {
  const post = await getSocialPostById(postId);

  if (!post) {
    throw new Error("Допис не знайдено");
  }

  if (post.authorId !== userId) {
    throw new Error("Ви не можете редагувати чужий допис");
  }

  const normalizedText = text?.trim();

  if (!normalizedText) {
    throw new Error("Текст допису не може бути порожнім");
  }

  if (normalizedText.length > MAX_POST_LENGTH) {
    throw new Error(
      `Текст допису не може перевищувати ${MAX_POST_LENGTH} символів`,
    );
  }

  if (bookId) {
    const book = await getBookById(bookId);

    if (!book) {
      throw new Error("Книгу не знайдено");
    }
  }

  return updateSocialPost(postId, {
    text: normalizedText,
    bookId,
  });
};

export const deleteSocialPostService = async (
  postId: string,
  userId: string,
) => {
  const post = await getSocialPostById(postId);

  if (!post) {
    throw new Error("Допис не знайдено");
  }

  if (post.authorId !== userId) {
    throw new Error("Ви не можете видалити чужий допис");
  }

  await deleteSocialPost(postId);

  return {
    success: true,
  };
};
