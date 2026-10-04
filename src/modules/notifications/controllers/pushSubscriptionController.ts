import type { Request, Response } from "express";

import {
  subscribeToPushService,
  unsubscribeFromPushService,
} from "../services/pushSubscriptionService.js";

export const subscribeToPushController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { endpoint, keys } = req.body;

    if (
      typeof endpoint !== "string" ||
      !endpoint ||
      !keys ||
      typeof keys.p256dh !== "string" ||
      !keys.p256dh ||
      typeof keys.auth !== "string" ||
      !keys.auth
    ) {
      return res.status(400).json({
        message: "Invalid push subscription",
      });
    }

    await subscribeToPushService({
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return res.status(201).json({
      success: true,
    });
  } catch (error) {
    console.error("Subscribe to push error:", error);

    return res.status(500).json({
      message: "Failed to subscribe to push notifications",
    });
  }
};

export const unsubscribeFromPushController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId;
    const { endpoint } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (typeof endpoint !== "string" || !endpoint) {
      return res.status(400).json({
        message: "Push endpoint is required",
      });
    }

    await unsubscribeFromPushService({
      userId,
      endpoint,
    });

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Unsubscribe from push error:", error);

    return res.status(500).json({
      message: "Failed to unsubscribe from push notifications",
    });
  }
};

export const getPushPublicKeyController = async (
  _req: Request,
  res: Response,
) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return res.status(503).json({
      message: "Web Push is not configured",
    });
  }

  return res.status(200).json({
    publicKey,
  });
};
