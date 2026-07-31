import { NextResponse } from "next/server";
import webpush from "web-push";
import { sendNativePush } from "@/lib/server-fcm";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:support@useadhera.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
}

function getLocalTodayStr(timezone: string): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
  } catch { return new Date().toISOString().split("T")[0]; }
}

function getLocalHour(timezone: string): number {
  try { return parseInt(new Date().toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false }), 10); }
  catch { return new Date().getHours(); }
}

function localTimeToUTC(dateStr: string, timeStr: string, timezone: string): number {
  try {
    const baselineMs = new Date(`${dateStr}T${timeStr}:00`).getTime();
    const desc = new Date(baselineMs).toLocaleString("en-US", {
      timeZone: timezone, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const describedMs = new Date(desc).getTime();
    if (isNaN(describedMs)) return baselineMs;
    return baselineMs - (describedMs - baselineMs);
  } catch { return new Date(`${dateStr}T${timeStr}:00`).getTime(); }
}

function getTodayDoseTimes(med: any, timezone: string): number[] {
  const todayStr = getLocalTodayStr(timezone);
  if (med.reminder_times && med.reminder_times.trim()) {
    return med.reminder_times.split(",").map((t: string) => {
      const [h, m] = t.trim().split(":");
      return localTimeToUTC(todayStr, `${h.padStart(2,"0")}:${(m||"00").padStart(2,"0")}`, timezone);
    });
  }
  const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
  const wakeTime = med.wake_time || "08:00";
  const dosesToday = med.times_per_day || 1;
  return Array.from({ length: dosesToday }, (_, i) => {
    const parts = wakeTime.split(":");
    const hours = parseInt(parts[0] || "8", 10) + Math.floor(i * intervalMs / 3600000);
    const minutes = (parseInt(parts[1] || "0", 10) + Math.floor((i * intervalMs % 3600000) / 60000)) % 60;
    return localTimeToUTC(todayStr, `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}`, timezone);
  });
}

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  if (sub.endpoint?.startsWith("fcm:")) {
    const { title, body, tag } = JSON.parse(payload);
    return sendNativePush({ endpoint: sub.endpoint, title, body, tag });
  }
  return webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
}

function calcStreakForUser(logs: any[], startDate: string, timezone: string): number {
  const userLogs = logs
    .filter(l => new Date(l.taken_at) >= new Date(startDate))
    .sort((a: any, b: any) => b.taken_at.localeCompare(a.taken_at));
  let count = 0;
  const d = new Date();
  const tz = timezone || "UTC";
  while (d >= new Date(startDate)) {
    const dayStr = d.toLocaleDateString("en-CA", { timeZone: tz });
    const took = userLogs.some((l: any) => l.taken_at.startsWith(dayStr));
    if (took) { count++; d.setDate(d.getDate() - 1); }
    else if (count === 0) { d.setDate(d.getDate() - 1); continue; }
    else break;
  }
  return count;
}

const STREAK_MSGS = [
  { min: 0,  title: "☀️ Good morning!", body: "Start your day right — take your medication and log how you feel." },
  { min: 4,  title: "🌟 4-day streak!", body: "You're building a great habit. Keep the momentum going!" },
  { min: 7,  title: "💪 One week strong!", body: "Seven days of consistency! You're proving your dedication." },
  { min: 14, title: "🏅 Two-week warrior!", body: "14 days in a row! Your body thanks you for the commitment." },
  { min: 30, title: "🔥 Month champion!", body: "30 days of adherence! This is the kind of dedication that changes lives." },
  { min: 60, title: "🏆 Unstoppable!", body: "60 days! You're in the top tier of medication adherence worldwide." },
  { min: 90, title: "👑 Legendary!", body: "90 days! You've made health a non-negotiable part of your life." },
];

async function fetchApi(path: string, options?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_SERVICE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY || ""}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const hasFCM = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !!process.env.FCM_PROJECT_ID;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    if (!hasFCM) return NextResponse.json({ ok: false, error: "VAPID keys not configured" }, { status: 500 });
  }

  try {
    const nowMs = Date.now();
    const windowStartMs = nowMs - 3600000;
    const windowEndMs = nowMs + 7200000;

    const meds: any[] = await fetchApi("medications?select=*&active=eq.true");
    const logs: any[] = await fetchApi("dose_logs?select=*,medications(name)&order=taken_at.desc&limit=500");
    const subs: any[] = await fetchApi("push_subscriptions?select=*");
    const profiles: any[] = await fetchApi("profiles?select=id,timezone,wake_time,reminder_lead,last_checkin_date");

    if (!Array.isArray(meds) || !Array.isArray(logs) || !Array.isArray(subs)) {
      return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 500 });
    }

    const profileTz = new Map<string, string>();
    const profileCheckinDate = new Map<string, string>();
    (profiles || []).forEach((p: any) => {
      profileTz.set(p.id, p.timezone || "UTC");
      if (p.last_checkin_date) profileCheckinDate.set(p.id, p.last_checkin_date);
    });

    const userSubs = new Map<string, any[]>();
    subs.forEach(s => {
      if (!userSubs.has(s.user_id)) userSubs.set(s.user_id, []);
      userSubs.get(s.user_id)!.push(s);
    });

    let sentCount = 0;

    for (const med of meds) {
      if (!med.active) continue;
      const end = new Date(med.start_date);
      end.setDate(end.getDate() + med.course_duration_days);
      if (end < new Date()) continue;

      const tz = profileTz.get(med.user_id) || "UTC";
      const todayStr = getLocalTodayStr(tz);
      const doseTimes = getTodayDoseTimes(med, tz);
      const todayLogs = logs.filter((l: any) => l.medication_id === med.id && l.taken_at?.startsWith(todayStr));

      for (const doseMs of doseTimes) {
        if (doseMs < windowStartMs || doseMs > nowMs) continue;
        const alreadyLogged = todayLogs.some((l: any) => Math.abs(new Date(l.taken_at).getTime() - doseMs) < 3600000);
        if (alreadyLogged) continue;

        const subscriptions = userSubs.get(med.user_id) || [];
        const daysSince = Math.max(1, Math.floor((Date.now() - new Date(med.start_date).getTime()) / 86400000) + 1);
        const payload = JSON.stringify({
          title: `💊 ${med.name}`,
          body: `Take ${med.dosage_amount} ${med.dosage_unit}${med.notes ? `\n\n${med.notes}` : ""}\nDay ${daysSince}/${med.course_duration_days}`,
          tag: `mt-dose-${med.id}-${doseMs}`,
        });

        for (const sub of subscriptions) {
          try {
            await sendPush(sub, payload);
            sentCount++;
          } catch (pushErr: any) {
            if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
              try {
                await fetchApi(`push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, { method: "DELETE" });
              } catch {}
            }
          }
        }
      }
    }

    // Also check for missed doses in the past hour (reminder resend)
    for (const med of meds) {
      if (!med.active) continue;
      const tz = profileTz.get(med.user_id) || "UTC";
      const todayStr = getLocalTodayStr(tz);
      const doseTimes = getTodayDoseTimes(med, tz);
      const todayLogs = logs.filter((l: any) => l.medication_id === med.id && l.taken_at?.startsWith(todayStr));

      for (const doseMs of doseTimes) {
        if (doseMs < windowStartMs || doseMs > nowMs) continue;
        const alreadyLogged = todayLogs.some((l: any) => Math.abs(new Date(l.taken_at).getTime() - doseMs) < 3600000);
        if (alreadyLogged) continue;

        const subscriptions = userSubs.get(med.user_id) || [];
        const daysSince = Math.max(1, Math.floor((Date.now() - new Date(med.start_date).getTime()) / 86400000) + 1);
        const payload = JSON.stringify({
          title: `⚠️ Missed: ${med.name}`,
          body: `You missed your ${med.dosage_amount} ${med.dosage_unit} dose.\nDay ${daysSince}/${med.course_duration_days}\nTap to log now.`,
          tag: `mt-missed-${med.id}-${doseMs}`,
        });

        for (const sub of subscriptions) {
          try {
            await sendPush(sub, payload);
            sentCount++;
          } catch {}
        }
      }
    }

    // Evening check-in reminder (7-9 PM local time)
    const userIds = [...new Set(meds.map((m: any) => m.user_id))];
    for (const userId of userIds) {
      const tz = profileTz.get(userId) || "UTC";
      const todayStr = getLocalTodayStr(tz);
      const localHour = getLocalHour(tz);
      if (localHour < 19 || localHour > 21) continue;
      const lastCheckin = profileCheckinDate.get(userId);
      if (lastCheckin === todayStr) continue;
      const subscriptions = userSubs.get(userId) || [];
      if (!subscriptions.length) continue;
      const streak = calcStreakForUser(logs, meds.find((m: any) => m.user_id === userId)?.start_date || "2020-01-01", tz);
      const payload = JSON.stringify({
        title: "🌙 How was your day?",
        body: `Take a moment to log how you're feeling today.${streak > 0 ? `\n🔥 Current streak: ${streak} days` : ""}\nTap to check in.`,
        tag: `mt-checkin-${todayStr}`,
      });
      for (const sub of subscriptions) {
        try { await sendPush(sub, payload); sentCount++; } catch {}
      }
    }

    // Streak milestone encouragements (early morning)
    for (const userId of userIds) {
      const tz = profileTz.get(userId) || "UTC";
      const localHour = getLocalHour(tz);
      if (localHour < 6 || localHour > 9) continue;
      const subscriptions = userSubs.get(userId) || [];
      if (!subscriptions.length) continue;
      const userMeds = meds.filter((m: any) => m.user_id === userId);
      if (!userMeds.length) continue;
      const streak = calcStreakForUser(logs, userMeds[0].start_date, tz);
      const msg = [...STREAK_MSGS].reverse().find(m => streak >= m.min) || STREAK_MSGS[0];
      const todayStr = getLocalTodayStr(tz);
      const payload = JSON.stringify({
        title: msg.title,
        body: `${msg.body}\n🔥 Current streak: ${streak} days`,
        tag: `mt-streak-${todayStr}`,
      });
      for (const sub of subscriptions) {
        try { await sendPush(sub, payload); sentCount++; } catch {}
      }
    }

    return NextResponse.json({ ok: true, sent: sentCount });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
