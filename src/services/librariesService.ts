import {
  addLibraryMember,
  createLibrary,
  getLibraryMembership,
  getUserLibraries,
} from "../repositories/librariesRepository.js";

import { getUserByEmail } from "../repositories/usersRepository.js";

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
