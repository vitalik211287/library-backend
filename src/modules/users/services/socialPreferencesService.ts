import { getUserById } from "../repositories/usersRepository.js";

import {
  getSocialPreference,
  setSocialActivityNotificationPreference,
} from "../repositories/socialPreferencesRepository.js";

export const getSocialPreferenceService = async (
  currentUserId: string,
  targetUserId: string,
) => {
  if (currentUserId === targetUserId) {
    return {
      notifyActivity: false,
    };
  }

  const targetUser = await getUserById(targetUserId);

  if (!targetUser) {
    throw new Error("User not found");
  }

  const preference = await getSocialPreference(
    currentUserId,
    targetUserId,
  );

  return {
    notifyActivity: preference?.notifyActivity ?? false,
  };
};

export const updateSocialPreferenceService = async (
  currentUserId: string,
  targetUserId: string,
  notifyActivity: boolean,
) => {
  if (currentUserId === targetUserId) {
    throw new Error(
      "You cannot change notification preferences for yourself",
    );
  }

  const targetUser = await getUserById(targetUserId);

  if (!targetUser) {
    throw new Error("User not found");
  }

  const preference =
    await setSocialActivityNotificationPreference(
      currentUserId,
      targetUserId,
      notifyActivity,
    );

  return {
    notifyActivity: preference.notifyActivity,
  };
};