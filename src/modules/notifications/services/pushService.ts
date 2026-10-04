import webpush from "web-push";

import {
  deletePushSubscription,
  getPushSubscriptionsByUserId,
} from "../repositories/pushSubscriptionRepository.js";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey,
  );
}

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export const sendPushToUser = async (
  userId: string,
  payload: PushPayload,
) => {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.warn("Web Push is not configured");
    return;
  }

  const subscriptions = await getPushSubscriptionsByUserId(userId);

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error
            ? Number(error.statusCode)
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscription({
            userId,
            endpoint: subscription.endpoint,
          });

          return;
        }

        console.error("Web Push send error:", error);
      }
    }),
  );
};
