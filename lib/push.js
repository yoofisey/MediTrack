import { sb } from "./supabase";

let CapacitorPushNotifications = null;

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

  pushListenerCleanup = () => {
    regListener.remove();
    errListener.remove();
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
