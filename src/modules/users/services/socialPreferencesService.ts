import { getUserById } from "../repositories/usersRepository.js";

import {
  getSocialPreference,
  setSocialNotificationPreference,
} from "../repositories/socialPreferencesRepository.js";

export const getSocialPreferenceService = async (
  currentUserId: string,
  targetUserId: string,
) => {
  if (currentUserId === targetUserId) {
    return {
      muteNotifications: false,
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
    muteNotifications:
      preference?.muteNotifications ?? false,
  };
};

export const updateSocialPreferenceService = async (
  currentUserId: string,
  targetUserId: string,
  muteNotifications: boolean,
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
    await setSocialNotificationPreference(
      currentUserId,
      targetUserId,
      muteNotifications,
    );

  return {
    muteNotifications: preference.muteNotifications,
  };
};