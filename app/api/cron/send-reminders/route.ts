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

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  if (sub.endpoint?.startsWith("fcm:")) {
    const { title, body, tag } = JSON.parse(payload);
    return sendNativePush({ endpoint: sub.endpoint, title, body, tag });
  }
  return webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
}

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

function getTodayDoseTimes(med: any): Date[] {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  if (med.reminder_times && med.reminder_times.trim()) {
    return med.reminder_times.split(",").map((t: string) => {
      const [h, m] = t.trim().split(":");
      return new Date(`${todayStr}T${(h||"08").padStart(2,"0")}:${(m||"00").padStart(2,"0")}:00`);
    });
  }
  const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
  const todayStart = new Date(`${todayStr}T${med.wake_time || "08:00"}:00`);
  const dosesToday = med.times_per_day || 1;
  return Array.from({ length: dosesToday }, (_, i) => new Date(todayStart.getTime() + i * intervalMs));
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
    const todayStr = new Date().toISOString().split("T")[0];

    const meds = await fetchApi("medications?select=*&active=eq.true");
    const logs: any[] = await fetchApi("dose_logs?select=*,medications(name)&order=taken_at.desc&limit=500");
    const subs: any[] = await fetchApi("push_subscriptions?select=*");

    if (!Array.isArray(meds) || !Array.isArray(logs) || !Array.isArray(subs)) {
      return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 500 });
    }

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

      const doseTimes = getTodayDoseTimes(med);
      const todayLogs = logs.filter((l: any) => l.medication_id === med.id && l.taken_at?.startsWith(todayStr));

      for (const doseAt of doseTimes) {
        const doseMs = doseAt.getTime();
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
      const doseTimes = getTodayDoseTimes(med);
      const todayLogs = logs.filter((l: any) => l.medication_id === med.id && l.taken_at?.startsWith(todayStr));

      for (const doseAt of doseTimes) {
        const doseMs = doseAt.getTime();
        if (doseMs < windowStartMs || doseMs > nowMs) continue;
        const alreadyLogged = todayLogs.some((l: any) => Math.abs(new Date(l.taken_at).getTime() - doseMs) < 3600000);
        if (alreadyLogged) continue;

        const subscriptions = userSubs.get(med.user_id) || [];
        const daysSince = Math.max(1, Math.floor((Date.now() - new Date(med.start_date).getTime()) / 86400000) + 1);
        const payload = JSON.stringify({
          title: `⚠️ Missed: ${med.name}`,
          body: `You missed your ${med.dosage_amount} ${med.dosage_unit} dose at ${doseAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.\nDay ${daysSince}/${med.course_duration_days}\nTap to log now.`,
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

    return NextResponse.json({ ok: true, sent: sentCount });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
