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
      } else {
        dispatchDeeplink(extra.medId, extra.doseTimeMs, extra.type);
      }
    });

    notifListenerCleanup = () => { handler.remove(); notifListenerCleanup = null; };

    launchNotifData = null;
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
          ongoing: true,
          autoCancel: false,
          extra: { medId: med.id, doseTimeMs: doseMs, type: 'reminder' },
          actionTypeId: 'DOSE_ACTION',
        });
      }
    }

    if (doseMs > now.getTime()) {
      allNotifications.push({
        id: notifId(med.id, doseMs, 'dose'),
        title: `${med.name}`,
        body: `Take ${doseInfo}${med.notes ? `\n${med.notes}` : ""}\n${day}${streak > 0 ? `\n${streak} day streak` : ""}`,
        schedule: { at: doseAt, allowWhileIdle: true },
        channelId: ADHERA_CHANNEL_ID,
        sound: 'beep.wav',
        ongoing: true,
        autoCancel: false,
        extra: { medId: med.id, doseTimeMs: doseMs, type: 'dose' },
        actionTypeId: 'DOSE_ACTION',
      });
    }
  }

  if (allNotifications.length) {
    await plugin.cancel({ notifications: allNotifications.map(n => ({ id: n.id })) });
    await plugin.schedule({ notifications: allNotifications });
  }

  const streakMilestones = [3, 7, 14, 30, 60, 90, 180];
  const celebrated = parseInt(localStorage.getItem("mt_streak_ms") || "0", 10);
  const milestone = streakMilestones.filter(m => streak >= m && m > celebrated).pop();
  if (milestone) {
    const milestoneNotifications = [{
      id: notifId("milestone", milestone, "dose"),
      title: `${milestone}-Day Streak!`,
      body: `Incredible! You've maintained a ${milestone}-day adherence streak. Keep it up!`,
      schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
      channelId: ADHERA_CHANNEL_ID,
      sound: "beep.wav",
      ongoing: true,
      autoCancel: false,
      extra: { type: "milestone", milestone, streak },
    }];
    await plugin.schedule({ notifications: milestoneNotifications });
    localStorage.setItem("mt_streak_ms", String(milestone));
  }
}

export function setupForegroundListener(onNotif) {
  let cleanup = null;
  ensurePlugin().then(ok => {
    if (!ok) return;
    const plugin = getPlugin();
    plugin.addListener("localNotificationReceived", (notification) => {
      try { onNotif?.(notification); } catch {}
    }).then(listener => {
      cleanup = () => { try { listener.remove(); } catch {} };
    }).catch(() => {});
  }).catch(() => {});
  return () => { try { cleanup?.(); } catch {} };
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
}

const visitNotifIds = {};

export async function scheduleNativeNotification({ id, title, body, scheduleAt, extra, actionTypeId }) {
  if (!scheduleAt) return;
  if (!(await ensurePlugin())) return;
  const plugin = getPlugin();
  const notifId = Math.abs(id.split("").reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0) % 2147483647) || 2;
  visitNotifIds[id] = notifId;
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
  if (!(await ensurePlugin())) return;
  const plugin = getPlugin();
  const notifId = visitNotifIds[id];
  if (notifId) {
    try { await plugin.cancel({ notifications: [{ id: notifId }] }); } catch {}
    delete visitNotifIds[id];
  }
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
}
