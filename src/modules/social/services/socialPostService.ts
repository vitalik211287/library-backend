import { getBookById } from "../../books/repositories/booksRepository.js";

import {
  createSocialPost,
  deleteSocialPost,
  getSocialPostById,
  getSocialPostThreadById,
  updateSocialPost,
} from "../repositories/socialPostRepository.js";

const MAX_POST_LENGTH = 1000;

type CreateSocialPostInput = {
  authorId: string;
  text: string;
  bookId?: string | null;
  parentId?: string | null;
};

export const createSocialPostService = async ({
  authorId,
  text,
  bookId = null,
  parentId = null,
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

  if (parentId) {
    const parentPost = await getSocialPostById(parentId);

    if (!parentPost) {
      throw new Error("Батьківський допис не знайдено");
    }

    if (parentPost.parentId) {
      throw new Error("Відповідати можна лише на основний допис");
    }
  }

  return createSocialPost({
    authorId,
    text: normalizedText,
    bookId,
    parentId,
  });
};

export const getSocialPostThreadService = async (postId: string) => {
  const post = await getSocialPostThreadById(postId);

  if (!post) {
    throw new Error("Допис не знайдено");
  }

  return post;
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
