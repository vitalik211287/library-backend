import type { Prisma } from "@prisma/client";

import {
  addLibraryMember,
  createBookInLibrary,
  createLibrary,
  getLibraryBooks,
  getLibraryMembership,
  getUserLibraries,
} from "../repositories/librariesRepository.js";

import { getUserByEmail } from "../repositories/usersRepository.js";
import prisma from "../utils/prisma.js";

export const getMyLibrariesService = async (userId: string) => {
  return getUserLibraries(userId);
};

export const createLibraryService = async (userId: string, name: string) => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Library name is required");
  }

  return createLibrary(userId, trimmedName);
};

export const addLibraryMemberService = async (
  currentUserId: string,
  libraryId: string,
  email: string,
) => {
  const membership = await getLibraryMembership(libraryId, currentUserId);

  if (!membership) {
    throw new Error("Library not found");
  }

  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    throw new Error("You do not have permission");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await getUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("User not found");
  }

  const existingMembership = await getLibraryMembership(libraryId, user.id);

  if (existingMembership) {
    throw new Error("User is already a library member");
  }

  return addLibraryMember(libraryId, user.id);
};

export const getLibraryBooksService = async (
  userId: string,
  libraryId: string,
) => {
  const membership = await getLibraryMembership(libraryId, userId);

  if (!membership) {
    throw new Error("Library not found");
  }

  const libraryBooks = await getLibraryBooks(libraryId);

  return libraryBooks.map((libraryBook) => libraryBook.book);
};

export const addBookToLibraryService = async (
  userId: string,
  libraryId: string,
  data: Prisma.BookCreateInput,
) => {
  const membership = await getLibraryMembership(libraryId, userId);

  if (!membership) {
    throw new Error("Library not found");
  }

  const existingBook = await prisma.book.findUnique({
    where: {
      isbn: data.isbn,
    },
  });

  if (existingBook) {
    const existingLibraryBook = await prisma.libraryBook.findUnique({
      where: {
        libraryId_bookId: {
          libraryId,
          bookId: existingBook.id,
        },
      },
    });

    if (existingLibraryBook) {
      throw new Error("Book already exists in library");
    }

    await prisma.libraryBook.create({
      data: {
        libraryId,
        bookId: existingBook.id,
      },
    });

    return existingBook;
  }

  return createBookInLibrary(libraryId, data);
};
