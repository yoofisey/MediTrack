import { calcStreak } from "./data";

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

export async function askNotifPerm() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

let alarmCtx = null;
let alarmTimers = [];

export function playAlarmSound() {
  try {
    stopAlarmSound();
    alarmCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [880, 660, 880];
    notes.forEach((freq, i) => {
      alarmTimers.push(setTimeout(() => {
        const osc = alarmCtx.createOscillator();
        const gain = alarmCtx.createGain();
        osc.connect(gain);
        gain.connect(alarmCtx.destination);
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.value = 0.2;
        osc.start();
        osc.stop(alarmCtx.currentTime + 0.35);
      }, i * 600));
    });
  } catch {}
}

export function stopAlarmSound() {
  alarmTimers.forEach(clearTimeout);
  alarmTimers = [];
  if (alarmCtx) { try { alarmCtx.close(); } catch {} alarmCtx = null; }
}

function showNotif(title, body, tag) {
  try {
    if (navigator.serviceWorker?.ready) {
      navigator.serviceWorker.ready.then(r => {
        r.showNotification(title, { body, icon: "/icon.svg", tag, vibrate: [500,200,500,200,500], requireInteraction: true });
      }).catch(() => {
        new Notification(title, { body, icon: "/favicon.ico", tag, vibrate: [500,200,500,200,500], requireInteraction: true });
      });
    } else {
      new Notification(title, { body, icon: "/favicon.ico", tag, vibrate: [500,200,500,200,500], requireInteraction: true });
    }
  } catch {}
}

function lastMilestoneCelebrated() {
  try { return parseInt(localStorage.getItem("mt_streak_ms") || "0", 10); } catch { return 0; }
}

function saveMilestoneCelebrated(streak) {
  try { localStorage.setItem("mt_streak_ms", String(streak)); } catch {}
}

export function scheduleNotifs(meds, leadMin, wakeTime, logs = []) {
  if (window._mt_timers) window._mt_timers.forEach(clearTimeout);
  window._mt_timers = [];
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const streak = calcStreak(logs, meds);
  const todayLogsCount = logs.filter(l => l.taken_at?.startsWith(todayStr)).length;

  const milestone = MILESTONES.filter(m => streak >= m).pop() || null;
  if (milestone && milestone > lastMilestoneCelebrated()) {
    const msg = MILESTONE_MSGS[milestone];
    showNotif(`${msg.emoji} ${msg.title}`, msg.body, `mt-streak-${milestone}`);
    saveMilestoneCelebrated(milestone);
  }

  meds.forEach(med => {
    if (!med.active) return;
    const end = new Date(med.start_date);
    end.setDate(end.getDate() + med.course_duration_days);
    if (end < now) return;
    const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
    const lead = med.reminder_minutes != null ? med.reminder_minutes : leadMin;
    const lastLog = logs.filter(l => l.medication_id === med.id).sort((a, b) => b.taken_at.localeCompare(a.taken_at))[0];
    const lastTime = lastLog ? new Date(lastLog.taken_at) : null;
    const todayStart = new Date(`${todayStr}T00:00:00`);
    let doseTimes = [];
    if (lastTime && lastTime >= todayStart) {
      const nextDose = new Date(lastTime.getTime() + intervalMs);
      if (nextDose > now) doseTimes.push(nextDose);
    } else {
      const base = new Date(`${todayStr}T${wakeTime || "08:00"}:00`);
      const dosesToday = med.times_per_day || 1;
      for (let i = 0; i < dosesToday; i++) doseTimes.push(new Date(base.getTime() + i * intervalMs));
    }
    doseTimes.forEach(doseAt => {
      const notifAt = new Date(doseAt.getTime() - lead * 60000);
      const delay = notifAt - now;
      if (delay < 0) return;
      const daysSinceStart = Math.max(1, Math.floor((now - new Date(med.start_date)) / 86400000) + 1);
      const totalDays = med.course_duration_days;
      const tag = `mt-${med.id}-${doseAt.getTime()}`;
      window._mt_timers.push(setTimeout(() => {
        if (!("Notification" in window)) return;
        playAlarmSound();
        const title = "🔔 Adhera";
        let body = `${lead > 0 ? `In ${lead} min: ` : ""}Take ${med.dosage_amount} ${med.dosage_unit} of ${med.name}`;
        const progress = totalDays ? ` (Day ${daysSinceStart}/${totalDays})` : "";
        if (streak > 0) body += ` 🔥 Day ${streak}`;
        if (streak > 0 && todayLogsCount === 0) body += ` — protect your streak!`;
        body += progress;
        showNotif(title, body, tag);
      }, delay));
    });
  });
}
