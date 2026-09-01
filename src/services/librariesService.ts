import type { LibraryRole, Prisma } from "@prisma/client";

import {
  addLibraryMember,
  countLibraryOwners,
  createBookInLibrary,
  createLibrary,
  deleteLibrary,
  getLibraryBooks,
  getLibraryMembers,
  getLibraryMembership,
  getUserLibraries,
  removeLibraryMember,
  updateLibraryMemberRole,
  updateLibraryName,
} from "../repositories/librariesRepository.js";

import { getUserByEmail } from "../repositories/usersRepository.js";
import prisma from "../utils/prisma.js";

const MANAGER_ROLES: LibraryRole[] = ["OWNER", "ADMIN"];

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
