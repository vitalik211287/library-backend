import type { LibraryRole, Prisma } from "@prisma/client";

import {
  addLibraryMember,
  countLibraryOwners,
  createBookInLibrary,
  createLibrary,
  deleteLibrary,
  getLibraryBook,
  getLibraryBookForUser,
  getLibraryBooks,
  getLibraryMembers,
  getLibraryMembership,
  getUserLibraries,
  removeLibraryMember,
  updateLibraryBook,
  updateLibraryBookCover,
  updateLibraryMemberRole,
  updateLibraryName,
} from "../repositories/librariesRepository.js";

import { getUserByEmail } from "../../users/repositories/usersRepository.js";

import { buildEffectiveBook } from "../../../utils/effectiveBook.js";
import prisma from "../../../utils/prisma.js";

const MANAGER_ROLES: LibraryRole[] = ["OWNER", "ADMIN"];

/* =========================
   PERMISSIONS
========================= */

const assertCanManageLibrary = async (
  libraryId: string,
  currentUserId: string,
) => {
  const membership = await getLibraryMembership(libraryId, currentUserId);

  if (!membership) {
    throw new Error("Library not found");
  }

  if (!MANAGER_ROLES.includes(membership.role)) {
    throw new Error("You do not have permission");
  }

  return membership;
};

const assertIsLibraryOwner = async (
  libraryId: string,
  currentUserId: string,
) => {
  const membership = await getLibraryMembership(libraryId, currentUserId);

  if (!membership) {
    throw new Error("Library not found");
  }

  if (membership.role !== "OWNER") {
    throw new Error("Only an owner can delete the library");
  }

  return membership;
};

const assertBookBelongsToLibrary = async (
  libraryId: string,
  bookId: string,
) => {
  const libraryBook = await getLibraryBook(libraryId, bookId);

  if (!libraryBook) {
    throw new Error("Book not found in this library");
  }

  return libraryBook;
};

export const assertCanEditLibraryBookService = async (
  currentUserId: string,
  libraryId: string,
  bookId: string,
) => {
  await assertCanManageLibrary(libraryId, currentUserId);

  return assertBookBelongsToLibrary(libraryId, bookId);
};

/* =========================
   LIBRARIES
========================= */

export const getMyLibrariesService = async (userId: string) => {
  const libraries = await getUserLibraries(userId);

  return libraries.map((library) => {
    const currentMembership = library.members.find(
      (member) => member.userId === userId,
    );

    return {
      ...library,
      role: currentMembership?.role ?? "MEMBER",
    };
  });
};

export const createLibraryService = async (userId: string, name: string) => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Library name is required");
  }

  return createLibrary(userId, trimmedName);
};

export const updateLibraryService = async (
  currentUserId: string,
  libraryId: string,
  name: string,
) => {
  await assertCanManageLibrary(libraryId, currentUserId);

  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Library name is required");
  }

  return updateLibraryName(libraryId, trimmedName);
};

export const deleteLibraryService = async (
  currentUserId: string,
  libraryId: string,
) => {
  await assertIsLibraryOwner(libraryId, currentUserId);

  return deleteLibrary(libraryId);
};

/* =========================
   MEMBERS
========================= */

export const addLibraryMemberService = async (
  currentUserId: string,
  libraryId: string,
  email: string,
) => {
  await assertCanManageLibrary(libraryId, currentUserId);

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

export const getLibraryMembersService = async (
  currentUserId: string,
  libraryId: string,
) => {
  const membership = await getLibraryMembership(libraryId, currentUserId);

  if (!membership) {
    throw new Error("Library not found");
  }

  return getLibraryMembers(libraryId);
};

export const updateLibraryMemberRoleService = async (
  currentUserId: string,
  libraryId: string,
  memberUserId: string,
  role: LibraryRole,
) => {
  const currentMembership = await assertCanManageLibrary(
    libraryId,
    currentUserId,
  );

  const targetMembership = await getLibraryMembership(libraryId, memberUserId);

  if (!targetMembership) {
    throw new Error("Library member not found");
  }

  if (
    currentMembership.role === "ADMIN" &&
    (targetMembership.role === "OWNER" || role === "OWNER")
  ) {
    throw new Error("Only an owner can manage owner roles");
  }

  if (targetMembership.role === "OWNER" && role !== "OWNER") {
    const ownerCount = await countLibraryOwners(libraryId);

    if (ownerCount <= 1) {
      throw new Error("Library must have at least one owner");
    }
  }

  return updateLibraryMemberRole(libraryId, memberUserId, role);
};

export const removeLibraryMemberService = async (
  currentUserId: string,
  libraryId: string,
  memberUserId: string,
) => {
  const currentMembership = await assertCanManageLibrary(
    libraryId,
    currentUserId,
  );

  const targetMembership = await getLibraryMembership(libraryId, memberUserId);

  if (!targetMembership) {
    throw new Error("Library member not found");
  }

  if (currentMembership.role === "ADMIN" && targetMembership.role === "OWNER") {
    throw new Error("Only an owner can remove an owner");
  }

  if (targetMembership.role === "OWNER") {
    const ownerCount = await countLibraryOwners(libraryId);

    if (ownerCount <= 1) {
      throw new Error("Library must have at least one owner");
    }
  }

  return removeLibraryMember(libraryId, memberUserId);
};

/* =========================
   GET LIBRARY BOOKS
========================= */

export const getLibraryBooksService = async (
  userId: string,
  libraryId: string,
) => {
  const membership = await getLibraryMembership(libraryId, userId);

  if (!membership) {
    throw new Error("Library not found");
  }

  const libraryBooks = await getLibraryBooks(libraryId, userId);

  return libraryBooks.map((libraryBook) => {
    const { users, ...book } = libraryBook.book;

    return buildEffectiveBook({
      book,
      libraryBook,
      userBook: users[0] ?? null,
    });
  });
};

/* =========================
   GET ONE LIBRARY BOOK
========================= */

export const getLibraryBookService = async (
  userId: string,
  libraryId: string,
  bookId: string,
) => {
  const membership = await getLibraryMembership(libraryId, userId);

  if (!membership) {
    throw new Error("Library not found");
  }

  const libraryBook = await getLibraryBookForUser(libraryId, bookId, userId);

  if (!libraryBook) {
    throw new Error("Book not found in this library");
  }

  const { users, ...book } = libraryBook.book;

  return buildEffectiveBook({
    book,
    libraryBook,
    userBook: users[0] ?? null,
  });
};

/* =========================
   ADD BOOK
========================= */

export const assertCanAddBookToLibraryService = async (
  userId: string,
  libraryId: string,
  isbn: string,
) => {
  const membership = await getLibraryMembership(libraryId, userId);

  if (!membership) {
    throw new Error("Library not found");
  }

  const existingBook = await prisma.book.findUnique({
    where: {
      isbn,
    },
  });

  if (!existingBook) {
    return null;
  }

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

  return existingBook;
};

export const addBookToLibraryService = async (
  userId: string,
  libraryId: string,
  data: Prisma.BookCreateInput,
  coverUrl?: string,
) => {
  const existingBook = await assertCanAddBookToLibraryService(
    userId,
    libraryId,
    data.isbn,
  );

  /*
   * Глобальна Book вже існує.
   * Створюємо тільки LibraryBook
   * з даними конкретної бібліотеки.
   */
  if (existingBook) {
    const libraryBook = await prisma.libraryBook.create({
      data: {
        libraryId,

        bookId: existingBook.id,

        title: data.title,

        author: data.author,

        ...(data.publisher !== undefined && {
          publisher: data.publisher,
        }),

        ...(data.year !== undefined && {
          year: data.year,
        }),

        ...(data.pages !== undefined && {
          pages: data.pages,
        }),

        ...(data.genre !== undefined && {
          genre: data.genre,
        }),

        ...(data.language !== undefined && {
          language: data.language,
        }),

        ...(data.description !== undefined && {
          description: data.description,
        }),

        ...((coverUrl || data.coverUrl) && {
          coverUrl: coverUrl ?? data.coverUrl,
        }),
      },

      include: {
        book: true,
      },
    });

    return buildEffectiveBook({
      book: libraryBook.book,
      libraryBook,
    });
  }

  /*
   * Глобальної Book ще немає.
   * Створюємо Book + LibraryBook.
   */
  const book = await createBookInLibrary(libraryId, data, coverUrl);

  /*
   * Беремо щойно створений
   * LibraryBook назад із БД,
   * щоб EffectiveBook завжди
   * складався одним mapper-ом.
   */
  const libraryBook = await getLibraryBook(libraryId, book.id);

  if (!libraryBook) {
    throw new Error("Failed to create library book");
  }

  return buildEffectiveBook({
    book: libraryBook.book,
    libraryBook,
  });
};

/* =========================
   UPDATE BOOK
========================= */

export const updateLibraryBookService = async (
  currentUserId: string,
  libraryId: string,
  bookId: string,
  data: Prisma.BookUpdateInput,
) => {
  await assertCanEditLibraryBookService(currentUserId, libraryId, bookId);

  const overrideData: Prisma.LibraryBookUpdateInput = {};

  if (typeof data.title === "string") {
    overrideData.title = data.title;
  }

  if (typeof data.author === "string") {
    overrideData.author = data.author;
  }

  if (data.publisher === null || typeof data.publisher === "string") {
    overrideData.publisher = data.publisher;
  }

  if (data.year === null || typeof data.year === "number") {
    overrideData.year = data.year;
  }

  if (data.pages === null || typeof data.pages === "number") {
    overrideData.pages = data.pages;
  }

  if (data.genre === null || typeof data.genre === "string") {
    overrideData.genre = data.genre;
  }

  if (data.language === null || typeof data.language === "string") {
    overrideData.language = data.language;
  }

  if (data.description === null || typeof data.description === "string") {
    overrideData.description = data.description;
  }

  if (data.coverUrl === null || typeof data.coverUrl === "string") {
    overrideData.coverUrl = data.coverUrl;
  }

  const updatedLibraryBook = await updateLibraryBook(
    libraryId,
    bookId,
    overrideData,
  );

  return buildEffectiveBook({
    book: updatedLibraryBook.book,
    libraryBook: updatedLibraryBook,
  });
};

/* =========================
   UPDATE COVER
========================= */

export const updateLibraryBookCoverService = async (
  currentUserId: string,
  libraryId: string,
  bookId: string,
  coverUrl: string,
) => {
  await assertCanEditLibraryBookService(currentUserId, libraryId, bookId);

  const updatedLibraryBook = await updateLibraryBookCover(
    libraryId,
    bookId,
    coverUrl,
  );

  return buildEffectiveBook({
    book: updatedLibraryBook.book,
    libraryBook: updatedLibraryBook,
  });
};




