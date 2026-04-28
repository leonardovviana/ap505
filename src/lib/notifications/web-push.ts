import webpush from "web-push";

type PushTarget = {
  endpoint: string;
  p256dh: string;
  auth_secret: string;
};

let configured = false;

function configureWebPush() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("VAPID keys não configuradas.");

  webpush.setVapidDetails("mailto:ap505@example.com", publicKey, privateKey);
  configured = true;
}

export async function sendPushNotification(
  subscription: PushTarget,
  payload: { title: string; body: string; url?: string },
) {
  configureWebPush();

  return webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth_secret,
      },
    },
    JSON.stringify(payload),
  );
}

export async function sendPushNotifications(
  subscriptions: PushTarget[],
  payload: { title: string; body: string; url?: string },
) {
  if (!subscriptions.length) return;

  await Promise.allSettled(
    subscriptions.map((subscription) => sendPushNotification(subscription, payload)),
  );
}
