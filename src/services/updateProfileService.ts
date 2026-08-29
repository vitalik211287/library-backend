import bcrypt from "bcryptjs";

import {
  getUserById,
  updateUserName,
  updateUserPassword,
  updateUserAvatar,
} from "../repositories/usersRepository.js";

import { uploadUserAvatar } from "../utils/uploadUserAvatar.js";

export const updateUserNameService =
  async (
    userId: string,
    name: string,
  ) => {
    const normalizedName =
      name.trim();

    if (
      normalizedName.length <
      2
    ) {
      throw new Error(
        "Name must be at least 2 characters",
      );
    }

    if (
      normalizedName.length >
      50
    ) {
      throw new Error(
        "Name is too long",
      );
    }

    const user =
      await updateUserName(
        userId,
        normalizedName,
      );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl:
        user.avatarUrl,
    };
  };

export const updateUserPasswordService =
  async (
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) => {
    const user =
      await getUserById(
        userId,
      );

    if (!user) {
      throw new Error(
        "User not found",
      );
    }

    const isPasswordValid =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );

    if (
      !isPasswordValid
    ) {
      throw new Error(
        "Current password is incorrect",
      );
    }

    if (
      newPassword.length <
      6
    ) {
      throw new Error(
        "Password must be at least 6 characters",
      );
    }

    const isSamePassword =
      await bcrypt.compare(
        newPassword,
        user.passwordHash,
      );

    if (
      isSamePassword
    ) {
      throw new Error(
        "New password must be different",
      );
    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        10,
      );

    await updateUserPassword(
      userId,
      passwordHash,
    );

    return {
      success: true,
    };
  };

export const updateUserAvatarService =
  async (
    userId: string,
    imageBuffer: Buffer,
  ) => {
    const user =
      await getUserById(
        userId,
      );

    if (!user) {
      throw new Error(
        "User not found",
      );
    }

    const avatarUrl =
      await uploadUserAvatar(
        imageBuffer,
        userId,
      );

    const updatedUser =
      await updateUserAvatar(
        userId,
        avatarUrl,
      );

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatarUrl:
        updatedUser.avatarUrl,
    };
  };