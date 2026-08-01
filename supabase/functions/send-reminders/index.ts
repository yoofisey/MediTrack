import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { SignJWT } from "npm:jose@5.9.6";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = "mailto:support@adhera.app";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID") || "";
const FCM_SERVICE_ACCOUNT_B64 = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON") || "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

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

async function getFCMAccessToken(): Promise<string | null> {
  if (!FCM_SERVICE_ACCOUNT_B64) return null;
  try {
    const raw = atob(FCM_SERVICE_ACCOUNT_B64);
    const key = JSON.parse(raw);
    const { client_email, private_key } = key;
    if (!client_email || !private_key) return null;
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT({
      iss: client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: client_email,
      iat: now,
      exp: now + 3600,
    })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .sign(private_key);
  } catch {
    return null;
  }
}

async function sendFCMPush(token: string, title: string, body: string, tag: string): Promise<boolean> {
  if (!FCM_PROJECT_ID) return false;
  const accessToken = await getFCMAccessToken();
  if (!accessToken) return false;
  try {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: { tag },
          android: { priority: "high", ttl: "86400s" },
          apns: {
            payload: {
              aps: {
                "mutable-content": 1,
                sound: "default",
                badge: 1,
                "content-available": 1,
              },
            },
          },
        },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  if (sub.endpoint?.startsWith("fcm:")) {
    const { title, body, tag } = JSON.parse(payload);
    return sendFCMPush(sub.endpoint.slice(4), title, body, tag);
  }
  return webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: 86400 });
}

function calcStreakForMed(medLogs: any[], startDate: string, timezone: string): number {
  const sorted = medLogs
    .filter(l => new Date(l.taken_at) >= new Date(startDate))
    .sort((a: any, b: any) => b.taken_at.localeCompare(a.taken_at));

  let count = 0;
  const d = new Date();
  const tz = timezone || "UTC";

  while (d >= new Date(startDate)) {
    const dayStr = d.toLocaleDateString("en-CA", { timeZone: tz });
    const took = sorted.some((l: any) => l.taken_at.startsWith(dayStr));
    if (took) { count++; d.setDate(d.getDate() - 1); }
    else if (count === 0) { d.setDate(d.getDate() - 1); continue; }
    else break;
  }
  return count;
}

const DAILY_MSGS = [
  { min: 0,  title: "☀️ Good morning!", body: "Start your day right — take your medication and log how you feel." },
  { min: 4,  title: "🌟 4-day streak!", body: "You're building a great habit. Keep the momentum going!" },
  { min: 7,  title: "💪 One week strong!", body: "Seven days of consistency! You're proving your dedication." },
  { min: 14, title: "🏅 Two-week warrior!", body: "14 days in a row! Your body thanks you for the commitment." },
  { min: 30, title: "🔥 Month champion!", body: "30 days of adherence! This is the kind of dedication that changes lives." },
  { min: 60, title: "🏆 Unstoppable!", body: "60 days! You're in the top tier of medication adherence worldwide." },
  { min: 90, title: "👑 Legendary!", body: "90 days! You've made health a non-negotiable part of your life." },
];

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: meds, error: medErr } = await supabase
      .from("medications")
      .select("*")
      .eq("active", true);

    if (medErr || !meds?.length) {
      return new Response(JSON.stringify({ ok: true, msg: "No active meds", sent: 0 }), { status: 200 });
    }

    const userIds = [...new Set(meds.map(m => m.user_id))];

    const [profilesRes, logsRes, subsRes] = await Promise.all([
      supabase.from("profiles").select("id, timezone, wake_time, reminder_lead, last_checkin_date").in("id", userIds),
      supabase.from("dose_logs").select("medication_id, taken_at, user_id").in("user_id", userIds).gte("taken_at", new Date(Date.now() - 86400000 * 2).toISOString()),
      supabase.from("push_subscriptions").select("user_id, endpoint, p256dh, auth").in("user_id", userIds),
    ]);

    if (subsRes.error) {
      return new Response(JSON.stringify({ ok: false, error: `push_subscriptions query failed: ${subsRes.error.message}` }), { status: 200 });
    }

    const profiles = profilesRes.data || [];
    const allLogs = logsRes.data || [];
    const subs = subsRes.data || [];

    const profileTz = new Map<string, string>();
    const profileCheckinDate = new Map<string, string>();
    profiles.forEach((p: any) => {
      profileTz.set(p.id, p.timezone || "UTC");
      if (p.last_checkin_date) profileCheckinDate.set(p.id, p.last_checkin_date);
    });

    if (!subs.length) {
      return new Response(JSON.stringify({ ok: true, msg: "No subscriptions", sent: 0 }), { status: 200 });
    }

    const subMap = new Map<string, any[]>();
    subs.forEach((s: any) => {
      if (!subMap.has(s.user_id)) subMap.set(s.user_id, []);
      subMap.get(s.user_id)!.push({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth });
    });

    let sent = 0;
    const now = new Date();
    const nowMs = Date.now();

    for (const med of meds) {
      const tz = profileTz.get(med.user_id) || "UTC";
      const prof = profiles.find(p => p.id === med.user_id);
      const wakeTime = prof?.wake_time || "08:00";
      const leadMin = prof?.reminder_lead ?? 30;
      const medLogs = allLogs.filter((l: any) => l.user_id === med.user_id && l.medication_id === med.id);

      const end = new Date(med.start_date);
      end.setDate(end.getDate() + med.course_duration_days);
      if (end < now) continue;

      const todayStr = getLocalTodayStr(tz);
      const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
      const todayStartMs = localTimeToUTC(todayStr, wakeTime, tz);
      const lastLog = medLogs.sort((a: any, b: any) => b.taken_at.localeCompare(a.taken_at))[0];

      let doseTimesMs: number[] = [];
      if (lastLog && new Date(lastLog.taken_at).getTime() >= todayStartMs) {
        const nextMs = new Date(lastLog.taken_at).getTime() + intervalMs;
        if (nextMs > nowMs) doseTimesMs.push(nextMs);
      } else {
        const dosesToday = med.times_per_day || 1;
        if (med.reminder_times && med.reminder_times.trim()) {
          doseTimesMs = med.reminder_times.split(",").map((t: string) => {
            const [h, m] = t.trim().split(":");
            return localTimeToUTC(todayStr, `${h.padStart(2,"0")}:${(m||"00").padStart(2,"0")}`, tz);
          });
        } else {
          for (let i = 0; i < dosesToday; i++) {
            const parts = wakeTime.split(":");
            const hours = parseInt(parts[0] || "8", 10) + Math.floor(i * intervalMs / 3600000);
            const minutes = (parseInt(parts[1] || "0", 10) + Math.floor((i * intervalMs % 3600000) / 60000)) % 60;
            doseTimesMs.push(localTimeToUTC(todayStr, `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}`, tz));
          }
        }
      }

      const todayCount = medLogs.filter((l: any) => l.taken_at?.startsWith(todayStr)).length;
      if (todayCount >= (med.times_per_day || 1)) continue;

      const streak = calcStreakForMed(allLogs.filter((l: any) => l.user_id === med.user_id), med.start_date, tz);
      const dayNum = Math.max(1, Math.floor((now.getTime() - new Date(med.start_date).getTime()) / 86400000) + 1);
      const day = `Day ${dayNum}/${med.course_duration_days}`;
      const doseInfo = `${med.dosage_amount} ${med.dosage_unit}`;

      for (const doseMs of doseTimesMs) {
        const diff = doseMs - nowMs;
        const reminderDiff = diff - leadMin * 60000;

        const isDoseTime = diff > -600000 && diff < 600000;
        const isReminderTime = leadMin > 0 && reminderDiff > -600000 && reminderDiff < 600000;

        if (!isDoseTime && !isReminderTime) continue;

        let title: string, body: string, tag: string;
        if (isReminderTime) {
          title = `⏰ Reminder: ${med.name}`;
          body = `${doseInfo} · ${day}${streak > 0 ? `\n🔥 Streak: ${streak} days` : ""}`;
          tag = `mt-rem-${med.id}-${doseMs}`;
        } else {
          title = `💊 ${med.name}`;
          body = `Take ${doseInfo}${med.notes ? `\n\n${med.notes}` : ""}\n${day}${streak > 0 ? `\n🔥 ${streak} day streak` : ""}`;
          tag = `mt-dose-${med.id}-${doseMs}`;
        }

        const payload = JSON.stringify({ title, body, tag });
        const userSubs = subMap.get(med.user_id) || [];

        for (const sub of userSubs) {
          try {
            await sendPush(sub, payload);
            sent++;
          } catch (e: any) {
            if (e.statusCode === 404 || e.statusCode === 410) {
              await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            }
          }
        }
      }
    }

    // Evening check-in reminder (7-9 PM local)
    for (const userId of userIds) {
      const tz = profileTz.get(userId) || "UTC";
      const todayStr = getLocalTodayStr(tz);
      const localHour = getLocalHour(tz);
      if (localHour < 19 || localHour > 21) continue;
      const lastCheckin = profileCheckinDate.get(userId);
      if (lastCheckin === todayStr) continue;
      const userSubs = subMap.get(userId);
      if (!userSubs?.length) continue;
      const userMeds = meds.filter((m: any) => m.user_id === userId);
      const streak = userMeds.length ? calcStreakForMed(allLogs.filter((l: any) => l.user_id === userId), userMeds[0].start_date, tz) : 0;
      const payload = JSON.stringify({
        title: "🌙 How was your day?",
        body: `Take a moment to log how you're feeling today.${streak > 0 ? `\n🔥 Current streak: ${streak} days` : ""}\nTap to check in.`,
        tag: `mt-checkin-${todayStr}`,
      });
      for (const sub of userSubs) {
        try { await sendPush(sub, payload); sent++; }
        catch (e: any) { if (e.statusCode === 404 || e.statusCode === 410) await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint); }
      }
    }

    // Streak milestone encouragements (morning)
    for (const userId of userIds) {
      const tz = profileTz.get(userId) || "UTC";
      const userLogs = allLogs.filter((l: any) => l.user_id === userId);
      const userSubs = subMap.get(userId);
      if (!userSubs?.length) continue;
      const userMeds = meds.filter((m: any) => m.user_id === userId);
      if (!userMeds.length) continue;
      const med = userMeds[0];
      const streak = calcStreakForMed(userLogs, med.start_date, tz);
      const msg = [...DAILY_MSGS].reverse().find(m => streak >= m.min) || DAILY_MSGS[0];
      const todayStr = getLocalTodayStr(tz);
      const payload = JSON.stringify({ title: msg.title, body: `${msg.body}\n🔥 Current streak: ${streak} days`, tag: `mt-daily-${todayStr}` });

      for (const sub of userSubs) {
        try {
          await sendPush(sub, payload);
          sent++;
        } catch (e: any) {
          if (e.statusCode === 404 || e.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
