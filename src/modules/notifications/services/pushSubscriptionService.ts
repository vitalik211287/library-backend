import {
  deletePushSubscription,
  upsertPushSubscription,
} from "../repositories/pushSubscriptionRepository.js";

export const subscribeToPushService = async ({
  userId,
  endpoint,
  p256dh,
  auth,
}: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}) => {
  return upsertPushSubscription({
    userId,
    endpoint,
    p256dh,
    auth,
  });
};

export const unsubscribeFromPushService = async ({
  userId,
  endpoint,
}: {
  userId: string;
  endpoint: string;
}) => {
  return deletePushSubscription({
    userId,
    endpoint,
  });
};
