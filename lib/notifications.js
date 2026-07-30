import { calcStreak } from "./data";
import { sb } from "./supabase";

function pad2(n) { return String(n).padStart(2, '0'); }
function localTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function makeLocalDate(hours, minutes) {
  const d = new Date();
  d.setHours(parseInt(hours) || 8, parseInt(minutes) || 0, 0, 0);
  return d;
}
function isLocalToday(utcIsoString) {
  if (!utcIsoString) return false;
  const d = new Date(utcIsoString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
      && d.getMonth() === now.getMonth()
      && d.getDate() === now.getDate();
}

const MILESTONES = [3, 7, 14, 30, 60, 90, 180];
const MILESTONE_MSGS = {
  3: { emoji:"🥉", title:"3-Day Streak!", body:"You've completed 3 days in a row! You're building momentum." },
  7: { emoji:"🥈", title:"One Week Strong!", body:"7 consecutive days! Consistency is key to better health." },
  14: { emoji:"🥇", title:"Two-Week Streak!", body:"14 days on track! Your routine is becoming a habit." },
  30: { emoji:"🔥", title:"30-Day Club!", body:"A full month of adherence! This is incredible dedication." },
  60: { emoji:"💪", title:"60 Days Strong!", body:"Two months of unwavering commitment. You're a champion!" },
  90: { emoji:"🏆", title:"90-Day Warrior!", body:"Quarter-year streak! Most people dream of this consistency." },
  180: { emoji:"👑", title:"Half-Year Legend!", body:"180 days of perfect adherence. Absolutely legendary!" },
};

let alarmCtx = null;
let alarmTimers = [];
let doseTimers = [];
let missedCheckTimer = null;

function ls() { try { return localStorage; } catch { return null; } }

export async function askNotifPerm() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const p = await Notification.requestPermission();
  if (p === "granted" && window._mt_swReady) {
    try { await navigator.serviceWorker.ready; } catch {}
  }
  return p;
}

export async function subscribeToPush(userId) {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await saveSubscription(userId, existing);
      return existing;
    }
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
    if (!vapidKey) return null;
    const applicationServerKey = Uint8Array.from(atob(vapidKey.replace(/-/g,"+").replace(/_/g,"/")), c => c.charCodeAt(0));
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    await saveSubscription(userId, sub);
    return sub;
  } catch (e) {
    console.error("Push subscribe error:", e);
    return null;
  }
}

async function saveSubscription(userId, subscription) {
  try {
    const { endpoint } = subscription;
    const keys = subscription.toJSON().keys;
    await sb.from("push_subscriptions").upsert({
      user_id: userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    }, { onConflict: "user_id,endpoint" });
  } catch (e) {
    console.error("Save subscription error:", e);
  }
}

export async function removePushSubscription(userId) {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sb.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
  } catch (e) {
    console.error("Remove subscription error:", e);
  }
}

export function playAlarmSound() {
  try {
    stopAlarmSound();
    alarmCtx = new (window.AudioContext || window.webkitAudioContext)();
    const pattern = [880, 660, 880, 660, 880];
    pattern.forEach((freq, i) => {
      alarmTimers.push(setTimeout(() => {
        const osc = alarmCtx.createOscillator();
        const gain = alarmCtx.createGain();
        osc.connect(gain);
        gain.connect(alarmCtx.destination);
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, alarmCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, alarmCtx.currentTime + 0.3);
        osc.start();
        osc.stop(alarmCtx.currentTime + 0.3);
      }, i * 500));
    });
    setTimeout(() => stopAlarmSound(), pattern.length * 500 + 500);
  } catch {}
}

export function stopAlarmSound() {
  alarmTimers.forEach(clearTimeout);
  alarmTimers = [];
  if (alarmCtx) { try { alarmCtx.close(); } catch {} alarmCtx = null; }
}

function showNotification(title, body, opts = {}) {
  try {
    const o = { icon: "/icon.svg", tag: opts.tag || "mt-alarm", vibrate: [500, 200, 500, 200, 500], requireInteraction: true, ...opts };
    if (navigator.serviceWorker?.ready) {
      navigator.serviceWorker.ready.then(r => r.showNotification(title, o)).catch(() => new Notification(title, o));
    } else {
      new Notification(title, o);
    }
  } catch {}
}

function lastMilestoneCelebrated() {
  const s = ls(); try { return parseInt(s?.getItem("mt_streak_ms") || "0", 10); } catch { return 0; }
}

function saveMilestoneCelebrated(streak) {
  const s = ls(); try { s?.setItem("mt_streak_ms", String(streak)); } catch {}
}

function checkMilestones(streak) {
  const milestone = MILESTONES.filter(m => streak >= m).pop() || null;
  if (milestone && milestone > lastMilestoneCelebrated()) {
    const msg = MILESTONE_MSGS[milestone];
    showNotification(`${msg.emoji} ${msg.title}`, msg.body, { tag: `mt-streak-${milestone}` });
    saveMilestoneCelebrated(milestone);
  }
}

function daysSinceStart(med) {
  const now = new Date();
  const start = new Date(med.start_date);
  return Math.max(1, Math.floor((now - start) / 86400000) + 1);
}

function dayLabel(med) {
  return `Day ${daysSinceStart(med)}/${med.course_duration_days}`;
}

function sendToSW(type, payload) {
  try {
    if (!navigator.serviceWorker?.controller) return;
    navigator.serviceWorker.controller.postMessage({ type, payload });
  } catch {}
}

let vitalTimers = [];

export function clearAllTimers() {
  doseTimers.forEach(clearTimeout);
  doseTimers = [];
  vitalTimers.forEach(clearTimeout);
  vitalTimers = [];
  if (missedCheckTimer) { clearTimeout(missedCheckTimer); missedCheckTimer = null; }
  window._mt_timers?.forEach(clearTimeout);
  window._mt_timers = [];
  if (isNativePlatform()) {
    import("./local-notifs").then(m => m.cancelAllScheduled()).catch(() => {});
  }
}

export function isNativePlatform() {
  try { return !!window.Capacitor?.isNativePlatform?.(); } catch { return false; }
}

export async function initCapacitorNotifs() {
  try {
    const m = await import("./local-notifs");
    if (m.isCapacitor()) await m.initCapacitorNotifs();
  } catch {}
}

export function scheduleDoseAlarms(meds, logs, wakeTime, leadMin) {
  clearAllTimers();

  if (isNativePlatform()) {
    const streak = calcStreak(logs, meds);
    import("./local-notifs").then(m => {
      m.cancelAllScheduled().then(() => {
        m.scheduleDoseNotifications(meds, logs, wakeTime || "08:00", leadMin || 30, streak);
      });
    });
    return;
  }

  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  const now = new Date();
  const todayStr = localTodayStr();
  const streak = calcStreak(logs, meds);
  const doseEvents = [];
  const todayLogsForMed = {};

  checkMilestones(streak);

  meds.forEach(med => {
    if (!med.active) return;
    const end = new Date(med.start_date);
    end.setDate(end.getDate() + med.course_duration_days);
    if (end < now) return;

    const lead = med.reminder_minutes != null ? med.reminder_minutes : leadMin;
    const lastLog = logs.filter(l => l.medication_id === med.id).sort((a, b) => b.taken_at.localeCompare(a.taken_at))[0];
    const logsToday = logs.filter(l => l.medication_id === med.id && isLocalToday(l.taken_at));
    todayLogsForMed[med.id] = logsToday.length;

    let doseTimes = [];

    if (med.reminder_times && med.reminder_times.trim()) {
      doseTimes = med.reminder_times.split(",").map(t => {
        const [h, m] = t.trim().split(":");
        return makeLocalDate(h, m);
      });
      if (lastLog && isLocalToday(lastLog.taken_at)) {
        doseTimes = doseTimes.filter(dt => dt > new Date(lastLog.taken_at));
      }
    } else {
      const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
      const todayStart = makeLocalDate(parseInt(wakeTime) || 8, 0);
      if (lastLog && new Date(lastLog.taken_at) >= todayStart) {
        const next = new Date(new Date(lastLog.taken_at).getTime() + intervalMs);
        if (next > now) doseTimes.push(next);
      } else {
        const dosesToday = med.times_per_day || 1;
        for (let i = 0; i < dosesToday; i++) doseTimes.push(new Date(todayStart.getTime() + i * intervalMs));
      }
    }

    const expectedToday = med.reminder_times ? doseTimes.length : (med.times_per_day || 1);
    doseTimes.forEach(doseAt => {
      const alreadyLoggedClose = logsToday.some(l => Math.abs(new Date(l.taken_at).getTime() - doseAt.getTime()) < 3600000);
      if (alreadyLoggedClose) return;
      if (doseAt > new Date(now.getTime() + 86400000)) return;

      doseEvents.push({ med, doseAt, lead });

      const day = dayLabel(med);
      const doseInfo = `${med.dosage_amount} ${med.dosage_unit}`;

      const reminderAt = new Date(doseAt.getTime() - lead * 60000);
      if (lead > 0 && reminderAt > now) {
        const delay = reminderAt - now;
        doseTimers.push(setTimeout(() => {
          if (!("Notification" in window)) return;
          const loggedNow = logsToday.length + todayLogsForMed[med.id] || 0;
          if (logs.filter(l => l.medication_id === med.id && isLocalToday(l.taken_at)).length >= expectedToday) return;
          showNotification(`⏰ Reminder: ${med.name}`, `${doseInfo} · ${day}${med.notes ? `\n\n${med.notes}` : ""}${streak > 0 ? `\n🔥 Streak: ${streak} days` : ""}`, { tag: `mt-rem-${med.id}-${doseAt.getTime()}` });
          try { window.dispatchEvent(new CustomEvent("mt-alarm", { detail: { med: { id: med.id, name: med.name, dosage_amount: med.dosage_amount, dosage_unit: med.dosage_unit, notes: med.notes }, day, streak, isReminder: true } })); } catch {}
        }, delay));
      }

      const doseDelay = doseAt - now;
      if (doseDelay <= 5000) {
        if (logsToday.length < expectedToday) {
          playAlarmSound();
          showNotification(`💊 ${med.name}`, `Take ${doseInfo}${med.notes ? `\n\n${med.notes}` : ""}\n${day}${streak > 0 ? `\n🔥 ${streak} day streak` : ""}`, { tag: `mt-dose-${med.id}-${doseAt.getTime()}` });
          try { window.dispatchEvent(new CustomEvent("mt-alarm", { detail: { med: { id: med.id, name: med.name, dosage_amount: med.dosage_amount, dosage_unit: med.dosage_unit, notes: med.notes }, day, streak } })); } catch {}
        }
      } else {
        doseTimers.push(setTimeout(() => {
          if (!("Notification" in window)) return;
          if (logs.filter(l => l.medication_id === med.id && isLocalToday(l.taken_at)).length >= expectedToday) return;
          playAlarmSound();
          showNotification(`💊 ${med.name}`, `Take ${doseInfo}${med.notes ? `\n\n${med.notes}` : ""}\n${day}${streak > 0 ? `\n🔥 ${streak} day streak` : ""}`, { tag: `mt-dose-${med.id}-${doseAt.getTime()}` });
          try { window.dispatchEvent(new CustomEvent("mt-alarm", { detail: { med: { id: med.id, name: med.name, dosage_amount: med.dosage_amount, dosage_unit: med.dosage_unit, notes: med.notes }, day, streak } })); } catch {}
        }, doseDelay));
      }
    });
  });

  sendToSW("schedule-doses", doseEvents.map(e => ({
    medId: e.med.id,
    name: e.med.name,
    dosageAmount: e.med.dosage_amount,
    dosageUnit: e.med.dosage_unit,
    notes: e.med.notes,
    timesPerDay: e.med.times_per_day,
    courseDays: e.med.course_duration_days,
    startDate: e.med.start_date,
    doseAt: e.doseAt.getTime(),
    lead: e.lead,
    streak,
  })));

  scheduleMissedCheck(meds, logs, todayStr);
}

function getTodayDoseTimes(med, wakeTime) {
  if (med.reminder_times && med.reminder_times.trim()) {
    return med.reminder_times.split(",").map(t => {
      const [h, m] = t.trim().split(":");
      return makeLocalDate(h, m);
    });
  }
  const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
  const todayStart = makeLocalDate(parseInt(wakeTime) || 8, 0);
  const dosesToday = med.times_per_day || 1;
  return Array.from({ length: dosesToday }, (_, i) => new Date(todayStart.getTime() + i * intervalMs));
}

function scheduleMissedCheck(meds, logs) {
  if (missedCheckTimer) clearTimeout(missedCheckTimer);
  missedCheckTimer = setTimeout(() => {
    if (!("Notification" in window)) return;
    const now = Date.now();
    meds.forEach(med => {
      if (!med.active) return;
      const end = new Date(med.start_date);
      end.setDate(end.getDate() + med.course_duration_days);
      if (end < new Date()) return;
      const todayLogs = logs.filter(l => l.medication_id === med.id && isLocalToday(l.taken_at));
      const doseTimes = getTodayDoseTimes(med, "08:00");
      doseTimes.forEach(dt => {
        if (dt > now) return;
        const alreadyLogged = todayLogs.some(l => Math.abs(new Date(l.taken_at).getTime() - dt.getTime()) < 3600000);
        if (!alreadyLogged) {
          showNotification(`⚠️ Missed: ${med.name}`, `Missed your ${med.dosage_amount} ${med.dosage_unit} dose at ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.\n${dayLabel(med)}\nTap to log now.`, { tag: `mt-missed-${med.id}-${dt.getTime()}` });
        }
      });
    });
  scheduleMissedCheck(meds, logs);
  }, 300000);
}

const visitTimers = {};

export function scheduleVisitReminder(visit) {
  cancelVisitReminder(visit.id);
  const reminderMin = parseInt(visit.reminder_minutes) || 0;
  if (reminderMin <= 0) return;
  if (!visit.date || !visit.time) return;
  const visitDate = new Date(visit.date + "T" + (visit.time || "09:00"));
  if (isNaN(visitDate.getTime())) return;
  const reminderTime = new Date(visitDate.getTime() - reminderMin * 60000);
  const now = new Date();
  if (reminderTime <= now) return;

  if (isNativePlatform()) {
    import("./local-notifs").then(m => m.scheduleNativeNotification({
      id: "visit-" + visit.id,
      title: `📅 Visit: ${visit.reason || "Doctor appointment"}`,
      body: `${visit.facility || visit.doctor || ""} at ${visit.time}${visit.notes ? "\n" + visit.notes : ""}`,
      scheduleAt: reminderTime,
    }));
    return;
  }

  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const delay = reminderTime - now;
  visitTimers[visit.id] = setTimeout(() => {
    if (!("Notification" in window)) return;
    showNotification(`📅 Visit: ${visit.reason || "Doctor appointment"}`, `${visit.facility || visit.doctor || ""} at ${visit.time}${visit.notes ? "\n" + visit.notes : ""}`, { tag: `mt-visit-${visit.id}` });
    delete visitTimers[visit.id];
  }, delay);
}

export function cancelVisitReminder(visitId) {
  if (visitTimers[visitId]) {
    clearTimeout(visitTimers[visitId]);
    delete visitTimers[visitId];
  }
  if (isNativePlatform()) {
    import("./local-notifs").then(m => m.cancelNativeNotification("visit-" + visitId));
  }
}

let refillNotified = {};

export function checkRefillReminders(meds, logs) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  if (!meds?.length) return;
  const s = ls();
  try { refillNotified = JSON.parse(s?.getItem("mt_refill_notified") || "{}"); } catch { refillNotified = {}; }
  const today = Date.now();
  meds.forEach(med => {
    if (!med.active || !med.pills_per_package) return;
    const lastRefill = med.last_refill_date ? new Date(med.last_refill_date) : new Date(med.start_date);
    const sinceRefill = logs.filter(l => l.medication_id === med.id && new Date(l.taken_at) >= lastRefill).length;
    const remaining = Math.max(0, (med.pills_per_package || 0) - sinceRefill);
    const alertAt = med.refill_reminder_at || 5;
    if (remaining <= alertAt && !refillNotified[med.id]) {
      const isLow = remaining <= 0;
      showNotification(
        isLow ? `⛔ ${med.name} — Out of stock` : `⚠️ ${med.name} — Low stock`,
        isLow
          ? `You've run out of ${med.name} (${med.dosage_amount} ${med.dosage_unit}). Tap to refill.`
          : `Only ${remaining} ${med.dosage_unit} of ${med.name} remaining. Refill soon to stay on track.`,
        { tag: `mt-refill-${med.id}`, requireInteraction: true }
      );
      refillNotified[med.id] = today;
      s?.setItem("mt_refill_notified", JSON.stringify(refillNotified));
    }
  });
}

export function testAlarm(med) {
  if (!("Notification" in window)) return;
  playAlarmSound();
  const doseInfo = med ? `${med.dosage_amount} ${med.dosage_unit}` : "2 tablet(s)";
  const name = med?.name || "Test Medication";
  showNotification(`🔔 Alarm test: ${name}`, `Dosage: ${doseInfo}\nDay 1/7\n\nThis is a test notification from Adhera.`, { tag: `mt-test-${Date.now()}` });
}

const VITAL_LABELS = {
  blood_pressure: { label:"Blood Pressure", icon:"🩺", unit:"mmHg" },
  glucose: { label:"Blood Sugar", icon:"🩸", unit:"mg/dL" },
  weight: { label:"Weight", icon:"⚖️", unit:"kg" },
  heart_rate: { label:"Heart Rate", icon:"❤️", unit:"bpm" },
  temperature: { label:"Temperature", icon:"🌡️", unit:"°F" },
  spo2: { label:"Oxygen Level", icon:"💨", unit:"%" },
};

const VITAL_INTERVALS = {
  "4h": 4, "6h": 6, "8h": 8, "12h": 12, "24h": 24,
  "morning_evening": 12,
};

export function scheduleVitalReminders(vitalReminders, vitals) {
  vitalTimers.forEach(clearTimeout);
  vitalTimers = [];
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  if (!vitalReminders || typeof window === "undefined") return;

  const now = new Date();

  Object.entries(vitalReminders).forEach(([vitalId, config]) => {
    if (!config || config.intervalId === "off") return;
    const meta = VITAL_LABELS[vitalId];
    if (!meta) return;

    const intervalHours = VITAL_INTERVALS[config.intervalId] || 0;
    if (intervalHours <= 0) return;

    const lastVital = (vitals || [])
      .filter(v => v.type === vitalId)
      .sort((a, b) => b.created_at?.localeCompare(a.created_at))[0];

    const todayReadings = (vitals || [])
      .filter(v => v.type === vitalId && isLocalToday(v.created_at)).length;

    let scheduledTime = null;
    if (lastVital?.created_at) {
      scheduledTime = new Date(new Date(lastVital.created_at).getTime() + intervalHours * 3600000);
    } else {
      if (config.intervalId === "morning_evening") {
        scheduledTime = new Date(now);
        scheduledTime.setHours(8, 0, 0, 0);
        if (scheduledTime <= now) {
          scheduledTime = new Date(now);
          scheduledTime.setHours(20, 0, 0, 0);
          if (scheduledTime <= now) scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
      } else {
        scheduledTime = new Date(now);
        scheduledTime.setHours(8, 0, 0, 0);
        if (scheduledTime <= now) scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
    }

    const title = `${meta.icon} Time to check your ${meta.label}`;
    const body = `Your ${meta.label} is due. Regular monitoring helps you stay on top of your health. Tap to log now.`;

    if (scheduledTime && scheduledTime > now) {
      const delay = scheduledTime - now;
      const timer = setTimeout(() => {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        showNotification(title, body, { tag: `mt-vital-${vitalId}-${scheduledTime.getTime()}` });
        try {
          window.dispatchEvent(new CustomEvent("mt-vital-reminder", {
            detail: { vitalId, label: meta.label, icon: meta.icon, scheduledTime: scheduledTime.toISOString() },
          }));
        } catch {}
      }, delay);
      vitalTimers.push(timer);
    } else if (scheduledTime && scheduledTime <= now && scheduledTime > new Date(now.getTime() - 3600000)) {
      showNotification(title, body, { tag: `mt-vital-${vitalId}-${scheduledTime.getTime()}` });
      try {
        window.dispatchEvent(new CustomEvent("mt-vital-reminder", {
          detail: { vitalId, label: meta.label, icon: meta.icon, scheduledTime: scheduledTime.toISOString() },
        }));
      } catch {}
    }
  });
}

export function isVitalDue(vitalId, vitals, intervalId) {
  if (!intervalId || intervalId === "off") return false;
  const intervalHours = VITAL_INTERVALS[intervalId] || 0;
  if (intervalHours <= 0) return false;
  const now = new Date();
  const lastVital = (vitals || [])
    .filter(v => v.type === vitalId)
    .sort((a, b) => b.created_at?.localeCompare(a.created_at))[0];
  if (!lastVital?.created_at) return true;
  const nextDue = new Date(new Date(lastVital.created_at).getTime() + intervalHours * 3600000);
  return now >= nextDue;
}

export function getVitalNextDue(vitalId, vitals, intervalId) {
  if (!intervalId || intervalId === "off") return null;
  const intervalHours = VITAL_INTERVALS[intervalId] || 0;
  if (intervalHours <= 0) return null;
  const lastVital = (vitals || [])
    .filter(v => v.type === vitalId)
    .sort((a, b) => b.created_at?.localeCompare(a.created_at))[0];
  if (!lastVital?.created_at) return new Date();
  return new Date(new Date(lastVital.created_at).getTime() + intervalHours * 3600000);
}
