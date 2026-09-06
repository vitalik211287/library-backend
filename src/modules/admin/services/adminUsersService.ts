import {
  getAdminUserById,
  getAdminUsers,
  updateAdminUserBlockedStatus,
} from "../repositories/adminUsersRepository.js";

export const getAdminUsersService = async () => {
  return getAdminUsers();
};

export const getAdminUserByIdService = async (
  userId: string,
) => {
  const user = await getAdminUserById(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
};

export const updateAdminUserBlockedStatusService = async (
  adminUserId: string,
  userId: string,
  isBlocked: boolean,
) => {
  if (adminUserId === userId && isBlocked) {
    throw new Error("CANNOT_BLOCK_SELF");
  }

  const user = await getAdminUserById(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return updateAdminUserBlockedStatus(
    userId,
    isBlocked,
  );
};
