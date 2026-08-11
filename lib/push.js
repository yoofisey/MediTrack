import { sb } from "./supabase";

let CapacitorPushNotifications = null;
let CapacitorLocalNotifications = null;

function getPlugin() {
  return CapacitorPushNotifications;
}

async function ensurePlugin() {
  if (CapacitorPushNotifications) return true;
  try {
    const mod = await import('@capacitor/push-notifications');
    CapacitorPushNotifications = mod.PushNotifications;
    return !!CapacitorPushNotifications;
  } catch {
    CapacitorPushNotifications = null;
    return false;
  }
}

async function ensureLocalPlugin() {
  if (CapacitorLocalNotifications) return true;
  try {
    const mod = await import('@capacitor/local-notifications');
    CapacitorLocalNotifications = mod.LocalNotifications;
    return !!CapacitorLocalNotifications;
  } catch {
    CapacitorLocalNotifications = null;
    return false;
  }
}

export function isCapacitor() {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
}

function getPlatform() {
  try {
    if (window.Capacitor?.getPlatform) return window.Capacitor.getPlatform();
  } catch {}
  return 'web';
}

let registeredToken = null;
let pushListenerCleanup = null;

export async function initPushNotifications(userId) {
  if (!(await ensurePlugin())) return null;
  const plugin = getPlugin();
  if (!userId) return null;

  if (pushListenerCleanup) pushListenerCleanup();

  let resolveToken;
  const tokenPromise = new Promise((resolve) => { resolveToken = resolve; });

  const regListener = await plugin.addListener('registration', (token) => {
    if (token?.value) {
      registeredToken = token.value;
      storePushToken(userId, token.value, getPlatform()).then(() => {
        resolveToken(token.value);
      }).catch(() => resolveToken(null));
    }
  });

  const errListener = await plugin.addListener('registrationError', () => {
    resolveToken(null);
  });

  const recvListener = await plugin.addListener('pushNotificationReceived', (notification) => {
    displayIncomingPush(notification);
  });

  pushListenerCleanup = () => {
    regListener.remove();
    errListener.remove();
    recvListener.remove();
    pushListenerCleanup = null;
  };

  const permResult = await plugin.requestPermissions().catch(() => ({ receive: 'denied' }));
  if (permResult.receive === 'denied') {
    resolveToken(null);
    return null;
  }

  await plugin.register();
  return tokenPromise;
}

function notifIdFromTag(tag) {
  const s = String(tag || "mt-push");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h % 2147483647) || 1;
}

async function displayIncomingPush(notification) {
  if (!(await ensureLocalPlugin())) return;
  const { title, body, data } = notification || {};
  if (!title && !body) return;
  const tag = data?.tag || notification?.tag || "mt-push";
  try {
    await CapacitorLocalNotifications.schedule({
      notifications: [{
        id: notifIdFromTag(tag),
        title: title || "Adhera",
        body: body || "Time to take your medication",
        channelId: "adhera-doses",
        sound: "beep.wav",
        schedule: { at: new Date(Date.now() + 1500), allowWhileIdle: true },
        extra: { tag },
        actionTypeId: "DOSE_ACTION",
      }],
    });
  } catch {}
}

async function storePushToken(userId, token, platform) {
  try {
    await sb.from("push_subscriptions").upsert({
      user_id: userId,
      endpoint: `fcm:${token}`,
      p256dh: platform,
      auth: "capacitor",
    }, { onConflict: "user_id,endpoint" });
  } catch (e) {
    console.error("store push token error:", e);
  }
}

export async function removePushToken(userId) {
  if (!(await ensurePlugin())) return;
  const plugin = getPlugin();
  if (!registeredToken) return;

  if (pushListenerCleanup) { pushListenerCleanup(); }

  try {
    await sb.from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", `fcm:${registeredToken}`);
  } catch {}

  registeredToken = null;
}
