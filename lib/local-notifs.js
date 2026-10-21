import { nextDoseDue } from "./data";

let CapacitorLocalNotifications = null;

export const ADHERA_CHANNEL_ID = "adhera-doses";

function getPlugin() {
  return CapacitorLocalNotifications;
}

async function ensureChannel(plugin) {
  try {
    await plugin.createChannel({
      id: ADHERA_CHANNEL_ID,
      name: "Adhera doses",
      description: "Medication reminders, dose alarms and adherence nudges",
      importance: 5,
      visibility: 1,
      sound: "beep.wav",
      vibration: true,
      lights: true,
    });
  } catch {}
}

async function ensurePlugin() {
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

export async function checkNotifPermission() {
  if (!(await ensurePlugin())) return "unsupported";
  const plugin = getPlugin();
  try {
    const status = await plugin.checkPermissions();
    return status?.display || "default";
  } catch {
    return "unsupported";
  }
}

export async function requestNotifPermission() {
  if (!(await ensurePlugin())) return "unsupported";
  const plugin = getPlugin();
  try {
    const status = await plugin.requestPermissions();
    return status?.display || "default";
  } catch {
    return "unsupported";
  }
}

function notifId(medId, doseTimeMs, type) {
  let h = 0;
  const s = `${medId}:${Math.floor(doseTimeMs / 60000)}:${type === 'reminder' ? 'r' : 'd'}`;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h % 2147483647) || 1;
}

// Native full-screen dose alarms (Android) are keyed by medication + dose time
// so the alarm can be cancelled or replaced deterministically.
export function doseAlarmId(medId, doseTimeMs) {
  return `dose-${medId}-${Math.floor(doseTimeMs / 60000)}`;
}

function doseAlarmPlugin() {
  try { return window.Capacitor?.Plugins?.DoseAlarm || null; } catch { return null; }
}

function isAndroidNative() {
  try { return window.Capacitor?.getPlatform?.() === 'android'; } catch { return false; }
}

function isIosNative() {
  try { return window.Capacitor?.getPlatform?.() === 'ios'; } catch { return false; }
}

function dayLabel(med) {
  const now = new Date();
  const start = new Date(med.start_date);
  const day = Math.max(1, Math.floor((now - start) / 86400000) + 1);
  return `Day ${day}/${med.course_duration_days}`;
}

let notifListenerCleanup = null;
let launchNotifData = null;

function dispatchDeeplink(medId, doseTimeMs, type, visitId) {
  try {
    window.dispatchEvent(new CustomEvent("mt-deeplink", {
      detail: { medId, doseTimeMs, type, visitId },
    }));
  } catch {}
}

function dispatchOpenVisit(visitId) {
  try {
    window.dispatchEvent(new CustomEvent("mt-open-visit", { detail: { visitId } }));
  } catch {}
}

function dispatchOpenVitals(vitalType) {
  try {
    window.dispatchEvent(new CustomEvent("mt-open-vitals", { detail: { vitalType } }));
  } catch {}
}

function dispatchOpenCheckin() {
  try {
    window.dispatchEvent(new CustomEvent("mt-open-checkin", {}));
  } catch {}
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

function dispatchLogDose(medId, doseTimeMs) {
  try {
    window.dispatchEvent(new CustomEvent("mt-log-dose", {
      detail: { medId, doseTimeMs },
    }));
  } catch {}
}

let pendingOpenAlarm = null;

function dispatchOpenAlarm(medId, isReminder) {
  if (!medId) return;
  pendingOpenAlarm = { medId, isReminder: !!isReminder };
  try {
    window.dispatchEvent(new CustomEvent("mt-open-alarm", {
      detail: { medId, isReminder: !!isReminder },
    }));
  } catch {}
}

/**
 * Returns the alarm that was opened before the app was ready to show it
 * (cold start from a notification tap).
 */
export function consumePendingOpenAlarm() {
  const pending = pendingOpenAlarm;
  pendingOpenAlarm = null;
  return pending;
}

export function getLaunchNotification() {
  return launchNotifData;
}

export async function initCapacitorNotifs() {
  if (!(await ensurePlugin())) return;
  const plugin = getPlugin();

  try {
    await ensureChannel(plugin);

    await plugin.registerActionTypes({
      types: [
        {
          id: 'DOSE_ACTION',
          actions: [
            { id: 'log', title: 'Log dose' },
            { id: 'snooze', title: 'Snooze 5 min' },
          ],
        },
        {
          id: 'VISIT_ACTION',
          actions: [
            { id: 'view', title: 'View details' },
          ],
        },
        {
          id: 'VITAL_ACTION',
          actions: [
            { id: 'log', title: 'Log now' },
            { id: 'snooze', title: 'Snooze 15 min' },
          ],
        },
        {
          id: 'MOTIVATION_ACTION',
          actions: [
            { id: 'open', title: 'Open app' },
          ],
        },
      ],
    });

    if (notifListenerCleanup) notifListenerCleanup();

    const handler = await plugin.addListener('localNotificationActionPerformed', (event) => {
      const { notification, actionId } = event;
      const { extra } = notification || {};

      if (extra?.tag?.startsWith("mt-visit-")) {
        dispatchOpenVisit(extra.visitId);
        return;
      }

      if (extra?.tag?.startsWith("mt-checkin-")) {
        dispatchOpenCheckin();
        return;
      }

      if (extra?.tag?.startsWith("mt-vital-")) {
        if (actionId === 'snooze') {
          plugin.schedule({
            notifications: [{
              ...notification,
              channelId: ADHERA_CHANNEL_ID,
              id: Math.abs((notifIdFromTag(extra.tag) + 900000) % 2147483647) || 1,
              schedule: { at: new Date(Date.now() + 900000), allowWhileIdle: true },
            }],
          }).catch(() => {});
        } else {
          dispatchOpenVitals(extra.vitalType);
        }
        return;
      }

      if (!extra?.medId) return;

      const isDoseAlarm = extra.type === 'dose' || extra.isAlarm === true;

      if (actionId === 'log') {
        dispatchLogDose(extra.medId, extra.doseTimeMs);
      } else if (actionId === 'snooze') {
        plugin.schedule({
          notifications: [{
            ...notification,
            channelId: ADHERA_CHANNEL_ID,
            id: notifId(extra.medId, Date.now() + 300000, 'snooze'),
            schedule: { at: new Date(Date.now() + 300000), allowWhileIdle: true },
          }],
        }).catch(() => {});
      } else if (isDoseAlarm) {
        // Tapping a dose alarm opens the full screen alarm (also on cold start,
        // the event is retained by the plugin until the app listens for it).
        dispatchOpenAlarm(extra.medId, false);
      } else {
        dispatchDeeplink(extra.medId, extra.doseTimeMs, extra.type);
      }
    });

    notifListenerCleanup = () => { handler.remove(); notifListenerCleanup = null; };

    launchNotifData = null;

    const launch = await plugin.getLaunchNotification().catch(() => null);
    const launchExtra = launch?.extra || {};
    if (launchExtra?.tag?.startsWith("mt-checkin-")) {
      setTimeout(dispatchOpenCheckin, 600);
    } else if (launchExtra?.tag?.startsWith("mt-visit-") && launchExtra?.visitId) {
      setTimeout(() => dispatchOpenVisit(launchExtra.visitId), 600);
    } else if (launchExtra?.tag?.startsWith("mt-vital-")) {
      setTimeout(() => dispatchOpenVitals(launchExtra.vitalType), 600);
    } else if ((launchExtra?.type === 'dose' || launchExtra?.isAlarm) && launchExtra?.medId) {
      // Cold start from a dose alarm notification - open the full screen alarm.
      setTimeout(() => dispatchOpenAlarm(launchExtra.medId, false), 600);
    }
  } catch {}
}

export function cleanupNotifListeners() {
  if (notifListenerCleanup) { notifListenerCleanup(); notifListenerCleanup = null; }
}

export async function scheduleDoseNotifications(meds, logs, wakeTime, leadMin, streak) {
  if (!(await ensurePlugin())) return;
  const plugin = getPlugin();

  const now = new Date();
  const allNotifications = [];
  const nativeAlarms = [];
  const keepIds = [];
  const android = isAndroidNative();

  for (const med of meds) {
    if (!med.active) continue;
    const end = new Date(med.start_date);
    end.setDate(end.getDate() + med.course_duration_days);
    if (end < now) continue;

    const lead = med.reminder_minutes != null ? med.reminder_minutes : leadMin;

    const next = nextDoseDue(med, logs);
    if (!next) continue;
    const doseAt = next;
    const doseMs = doseAt.getTime();
    if (doseMs > new Date(now.getTime() + 86400000).getTime()) continue;

    const doseInfo = `${med.dosage_amount} ${med.dosage_unit}`;
    const day = dayLabel(med);
    const alarmId = doseAlarmId(med.id, doseMs);
    // Keep the alarm slot alive for a short while after the dose time so a
    // snoozed alarm is not dropped by the next reschedule.
    if (doseMs > now.getTime() - 3600000) keepIds.push(alarmId);

    if (lead > 0) {
      const reminderAt = new Date(doseMs - lead * 60000);
      if (reminderAt > now) {
        allNotifications.push({
          id: notifId(med.id, doseMs, 'reminder'),
          title: `Reminder: ${med.name}`,
          body: `${doseInfo} · ${day}${med.notes ? `\n${med.notes}` : ""}${streak > 0 ? `\nStreak: ${streak} days` : ""}`,
          schedule: { at: reminderAt, allowWhileIdle: true },
          channelId: ADHERA_CHANNEL_ID,
          sound: 'beep.wav',
          autoCancel: true,
          extra: { medId: med.id, doseTimeMs: doseMs, type: 'reminder' },
          actionTypeId: 'DOSE_ACTION',
        });
      }
    }

    if (doseMs > now.getTime()) {
      if (med.remind_at_dose === false) continue;
      const body = `Take ${doseInfo}${med.notes ? `\n${med.notes}` : ""}\n${day}${streak > 0 ? `\n${streak} day streak` : ""}`;
      if (android) {
        // Android: the dose itself is a full screen alarm (native plugin).
        nativeAlarms.push({
          id: alarmId,
          medId: med.id,
          doseTimeMs: doseMs,
          title: med.name,
          body,
          day,
          streak: streak || 0,
          dosageAmount: med.dosage_amount,
          dosageUnit: med.dosage_unit,
          notes: med.notes || '',
        });
      } else {
        allNotifications.push({
          id: notifId(med.id, doseMs, 'dose'),
          title: `${med.name}`,
          body,
          schedule: { at: doseAt, allowWhileIdle: true },
          channelId: ADHERA_CHANNEL_ID,
          sound: 'beep.wav',
          ongoing: true,
          autoCancel: false,
          extra: { medId: med.id, doseTimeMs: doseMs, type: 'dose', isAlarm: true },
          actionTypeId: 'DOSE_ACTION',
          smallIcon: 'ic_stat_adhera',
          iconColor: '#ff3b30',
          // iOS breaks through Focus for dose alarms (no full screen takeover
          // is possible without Apple's critical alerts entitlement).
          ...(isIosNative() ? { interruptionLevel: 'timeSensitive' } : {}),
        });
      }
    } else if (doseMs > now.getTime() - 3600000) {
      const lastLog = (logs || []).filter(l => l.medication_id === med.id).sort((a, b) => (b.taken_at || "").localeCompare(a.taken_at || ""))[0];
      const logged = lastLog && new Date(lastLog.taken_at).getTime() >= doseMs - 60000;
      if (!logged) {
        allNotifications.push({
          id: notifId(med.id, doseMs, 'missed'),
          title: `Missed: ${med.name}`,
          body: `Missed your ${doseInfo} dose at ${new Date(doseMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Tap to log now.`,
          schedule: { at: new Date(now.getTime() + 2000), allowWhileIdle: true },
          channelId: ADHERA_CHANNEL_ID,
          sound: 'beep.wav',
          autoCancel: true,
          extra: { medId: med.id, doseTimeMs: doseMs, type: 'missed' },
          actionTypeId: 'DOSE_ACTION',
        });
      }
    }
  }

  if (allNotifications.length) {
    await plugin.cancel({ notifications: allNotifications.map(n => ({ id: n.id })) });
    await plugin.schedule({ notifications: allNotifications });
  }

  if (android) await scheduleNativeDoseAlarms(nativeAlarms, keepIds);
}

async function scheduleNativeDoseAlarms(alarms, keepIds) {
  const plugin = doseAlarmPlugin();
  if (!plugin?.schedule) return;
  try {
    for (const alarm of alarms) {
      await plugin.schedule(alarm);
    }
    // Drop alarms for medications that are no longer scheduled.
    if (plugin.prune) await plugin.prune({ ids: keepIds || [] });
  } catch {}
}


export function setupForegroundListener(onNotif) {
  let cleanup = null;
  ensurePlugin().then(ok => {
    if (!ok) return;
    const plugin = getPlugin();
    plugin.addListener("localNotificationReceived", (notification) => {
      const extra = notification?.extra || {};
      // A dose that comes in while the app is open gets the full screen alarm
      // treatment instead of the small foreground banner.
      if ((extra.type === 'dose' || extra.isAlarm) && extra.medId) {
        dispatchOpenAlarm(extra.medId, false);
        return;
      }
      try { onNotif?.(notification); } catch {}
    }).then(listener => {
      cleanup = () => { try { listener.remove(); } catch {} };
    }).catch(() => {});
  }).catch(() => {});
  return () => { try { cleanup?.(); } catch {} };
}

/**
 * Android full-screen dose alarms: the native alarm fires while the app is in
 * the foreground and hands the payload to the web layer.
 */
export function setupDoseAlarmListener(onAlarm) {
  let cleanup = null;
  let attempts = 0;
  let cancelled = false;

  const attach = () => {
    if (cancelled) return;
    const plugin = doseAlarmPlugin();
    if (!plugin?.addListener) {
      // The native plugin script is injected right after the web app starts.
      if (attempts < 20) {
        attempts += 1;
        setTimeout(attach, 300);
      }
      return;
    }
    plugin.addListener("doseAlarm", (payload) => {
      try { onAlarm?.(payload || {}); } catch {}
    }).then(listener => {
      cleanup = () => { try { listener.remove(); } catch {} };
    }).catch(() => {});
  };

  attach();
  return () => {
    cancelled = true;
    try { cleanup?.(); } catch {}
  };
}

/** Dose logs recorded from the native lock-screen alarm, waiting to be synced. */
export async function getPendingDoseLogs() {
  const plugin = doseAlarmPlugin();
  if (!plugin?.getPendingDoseLogs) return [];
  try {
    const res = await plugin.getPendingDoseLogs();
    return Array.isArray(res?.logs) ? res.logs : [];
  } catch {
    return [];
  }
}

export async function clearPendingDoseLogs(ids) {
  const plugin = doseAlarmPlugin();
  if (!plugin?.clearPendingDoseLogs) return;
  try { await plugin.clearPendingDoseLogs(ids && ids.length ? { ids } : {}); } catch {}
}

export async function canUseFullScreenIntent() {
  const plugin = doseAlarmPlugin();
  if (!plugin?.canUseFullScreenIntent) return null;
  try {
    const res = await plugin.canUseFullScreenIntent();
    return { can: res?.can === true, requiresSettings: res?.requiresSettings === true };
  } catch {
    return null;
  }
}

export function openFullScreenIntentSettings() {
  try { doseAlarmPlugin()?.openFullScreenIntentSettings?.(); } catch {}
}

export async function cancelDoseNotifications(medId, doseTimeMs) {
  if (!(await ensurePlugin())) return;
  const plugin = getPlugin();
  const ids = [
    notifId(medId, doseTimeMs, 'dose'),
    notifId(medId, doseTimeMs, 'reminder'),
  ].filter(id => id > 0);
  if (ids.length) {
    await plugin.cancel({ notifications: ids.map(id => ({ id })) });
  }
  const native = doseAlarmPlugin();
  if (native?.cancel) {
    try { await native.cancel({ id: doseAlarmId(medId, doseTimeMs) }); } catch {}
  }
}

/** Cancels every native full screen alarm of one medication. */
export async function cancelNativeDoseAlarms(medId, doseTimeMs) {
  if (!medId) return;
  const native = doseAlarmPlugin();
  if (!native?.cancelForMedication) return;
  try { await native.cancelForMedication({ medId, doseTimeMs: doseTimeMs || 0 }); } catch {}
}

export function notifIdFromString(id) {
  return Math.abs(id.split("").reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0) % 2147483647) || 2;
}

export async function scheduleNativeNotification({ id, title, body, scheduleAt, extra, actionTypeId }) {
  if (!scheduleAt) return;
  if (!(await ensurePlugin())) return;
  const plugin = getPlugin();
  const notifId = notifIdFromString(id);
  try {
    await plugin.schedule({
      notifications: [{
        id: notifId,
        title,
        body,
        schedule: { at: scheduleAt, allowWhileIdle: true },
        channelId: ADHERA_CHANNEL_ID,
        sound: 'beep.wav',
        extra: extra || {},
        ...(actionTypeId ? { actionTypeId } : {}),
      }],
    });
  } catch {}
}

export async function cancelNativeNotification(id) {
  if (!id) return;
  if (!(await ensurePlugin())) return;
  const plugin = getPlugin();
  try { await plugin.cancel({ notifications: [{ id: notifIdFromString(id) }] }); } catch {}
}

export async function cancelByTagPrefix(prefix) {
  if (!prefix) return;
  if (!(await ensurePlugin())) return;
  const plugin = getPlugin();
  try {
    const pending = await plugin.getPending();
    const ids = (pending?.notifications || [])
      .filter(n => String(n.extra?.tag || "").startsWith(prefix))
      .map(n => n.id);
    if (ids.length) await plugin.cancel({ notifications: ids.map(id => ({ id })) });
  } catch {}
}

export async function scheduleNativeNotifications(notifications = []) {
  if (!(await ensurePlugin())) return;
  await cancelByTagPrefix("mt-vital-");
  for (const n of notifications) {
    await scheduleNativeNotification(n);
  }
}

export async function canScheduleExactAlarms() {
  try {
    const p = window.Capacitor?.Plugins?.ExactAlarm;
    if (!p) return null;
    const r = await p.canScheduleExactAlarms();
    return r?.can === true;
  } catch {
    return null;
  }
}

export function openExactAlarmSettings() {
  try { window.Capacitor?.Plugins?.ExactAlarm?.openExactAlarmSettings?.(); } catch {}
}

export function openAppSettings() {
  try { window.Capacitor?.Plugins?.ExactAlarm?.openAppSettings?.(); } catch {}
}

export async function cancelAllScheduled() {
  if (!(await ensurePlugin())) return;
  const plugin = getPlugin();
  try {
    const pending = await plugin.getPending();
    if (pending?.notifications?.length) {
      await plugin.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    }
  } catch {}
  const native = doseAlarmPlugin();
  if (native?.cancelAll) {
    try { await native.cancelAll(); } catch {}
  }
}
