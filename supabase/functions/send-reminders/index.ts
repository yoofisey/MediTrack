import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { SignJWT } from "npm:jose@5.9.6";
import { getCountry } from "npm:countries-and-timezones@3.10.0";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = "mailto:support@adhera.app";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID") || "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// countries-and-timezones orders multi-zone countries by tzdb key order,
// so pin the main zone for the ones where that order is unhelpful.
const COUNTRY_TZ_OVERRIDE: Record<string, string> = {
  US: "America/New_York",
  CA: "America/Toronto",
  AU: "Australia/Sydney",
  MX: "America/Mexico_City",
  BR: "America/Sao_Paulo",
  ES: "Europe/Madrid",
  RU: "Europe/Moscow",
};

function countryTimezone(country: string | null | undefined): string {
  if (!country) return "";
  const code = country.toUpperCase();
  const override = COUNTRY_TZ_OVERRIDE[code];
  if (override) return override;
  try {
    const c = getCountry(code);
    if (c?.timezones?.length) return c.timezones[0];
  } catch {}
  return "";
}

function userTimezone(tz: string | null | undefined, country: string | null | undefined): string {
  return tz && tz.trim() ? tz : (countryTimezone(country) || "UTC");
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

async function pemToCryptoKey(pem: string): Promise<CryptoKey> {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

async function getFCMAccessToken(): Promise<{ token?: string; error?: string }> {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON") || "";
  if (!raw) return { error: "env FIREBASE_SERVICE_ACCOUNT_JSON not set" };
  try {
    let key: any = null;
    try { key = JSON.parse(raw); } catch {}
    if (!key) {
      try { key = JSON.parse(atob(raw)); } catch {}
    }
    if (!key) return { error: "cannot parse secret (raw JSON or base64)" };
    const { client_email, private_key } = key;
    if (!client_email || !private_key) return { error: "missing client_email/private_key" };
    const now = Math.floor(Date.now() / 1000);
    const signingKey = await pemToCryptoKey(private_key);
    const jwt = await new SignJWT({
      iss: client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .sign(signingKey);
    return { token: jwt };
  } catch (e) {
    return { error: `mint failed: ${String(e)}` };
  }
}

async function sendFCMPush(token: string, title: string, body: string, tag: string): Promise<{ ok: boolean; statusCode?: number; detail?: string }> {
  if (!FCM_PROJECT_ID) return { ok: false, detail: "FCM_PROJECT_ID not set" };
  const auth = await getFCMAccessToken();
  if (!auth.token) return { ok: false, detail: auth.error || "no access token" };
  try {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${auth.token}`,
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
    const txt = await res.text();
    console.log(`FCM send ${res.status}: ${txt.slice(0, 300)}`);
    if (!res.ok) return { ok: false, statusCode: res.status, detail: txt.slice(0, 300) };
    return { ok: true, statusCode: res.status };
  } catch (e) {
    console.log("FCM send error", String(e));
    return { ok: false, detail: String(e) };
  }
}

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string): Promise<{ ok: boolean; type: string; statusCode?: number; detail?: string }> {
  if (sub.endpoint?.startsWith("fcm:")) {
    const { title, body, tag } = JSON.parse(payload);
    const r = await sendFCMPush(sub.endpoint.slice(4), title, body, tag);
    return { ok: r.ok, type: "fcm", statusCode: r.statusCode, detail: r.detail };
  }
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: 86400 });
    return { ok: true, type: "web" };
  } catch (e: any) {
    return { ok: false, type: "web", statusCode: e?.statusCode, detail: String(e) };
  }
}

async function claimTag(supabase: any, tag: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("notification_dedup")
      .insert({ tag }, { ignoreDuplicates: true })
      .select("tag");
    return Array.isArray(data) && data.length > 0;
  } catch {
    return true;
  }
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
  { min: 0,  title: "Good morning!", body: "Start your day right — take your medication and log how you feel." },
  { min: 4,  title: "4-day streak!", body: "You're building a great habit. Keep the momentum going!" },
  { min: 7,  title: "One week strong!", body: "Seven days of consistency! You're proving your dedication." },
  { min: 14, title: "Two-week warrior!", body: "14 days in a row! Your body thanks you for the commitment." },
  { min: 30, title: "Month champion!", body: "30 days of adherence! This is the kind of dedication that changes lives." },
  { min: 60, title: "Unstoppable!", body: "60 days! You're in the top tier of medication adherence worldwide." },
  { min: 90, title: "Legendary!", body: "90 days! You've made health a non-negotiable part of your life." },
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
      supabase.from("profiles").select("id, timezone, country, wake_time, reminder_lead, last_checkin_date").in("id", userIds),
      supabase.from("dose_logs").select("medication_id, taken_at, user_id").in("user_id", userIds).gte("taken_at", new Date(Date.now() - 86400000 * 7).toISOString()),
      supabase.from("push_subscriptions").select("user_id, endpoint, p256dh, auth").in("user_id", userIds),
    ]);

    if (subsRes.error) {
      return new Response(JSON.stringify({ ok: false, error: `push_subscriptions query failed: ${subsRes.error.message}` }), { status: 200 });
    }

    const profiles = profilesRes.data || [];
    const allLogs = logsRes.data || [];
    const subs = subsRes.data || [];

    const profileTz = new Map<string, string>();
    const profileCountry = new Map<string, string>();
    const profileCheckinDate = new Map<string, string>();
    profiles.forEach((p: any) => {
      profileTz.set(p.id, p.timezone || "");
      profileCountry.set(p.id, p.country || "");
      if (p.last_checkin_date) profileCheckinDate.set(p.id, p.last_checkin_date);
    });

    const tzFor = (userId: string): string => userTimezone(profileTz.get(userId), profileCountry.get(userId));

    if (!subs.length) {
      return new Response(JSON.stringify({ ok: true, msg: "No subscriptions", sent: 0 }), { status: 200 });
    }

    const subMap = new Map<string, any[]>();
    subs.forEach((s: any) => {
      if (!subMap.has(s.user_id)) subMap.set(s.user_id, []);
      subMap.get(s.user_id)!.push({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth });
    });

    let sent = 0;
    const results: any[] = [];
    const now = new Date();
    const nowMs = Date.now();

    for (const med of meds) {
      const tz = tzFor(med.user_id);
      const prof = profiles.find(p => p.id === med.user_id);
      const leadMin = prof?.reminder_lead ?? 30;
      const medLogs = allLogs.filter((l: any) => l.user_id === med.user_id && l.medication_id === med.id);

      const end = new Date(med.start_date);
      end.setDate(end.getDate() + med.course_duration_days);
      if (end < now) continue;

      const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
      const lastLog = medLogs.sort((a: any, b: any) => b.taken_at.localeCompare(a.taken_at))[0];
      if (!lastLog) continue;

      const nextMs = new Date(lastLog.taken_at).getTime() + intervalMs;
      if (medLogs.some((l: any) => new Date(l.taken_at).getTime() >= nextMs)) continue;

      const diff = nextMs - nowMs;
      const reminderDiff = diff - leadMin * 60000;

      const isDoseTime = diff > -600000 && diff < 600000;
      const isReminderTime = leadMin > 0 && reminderDiff > -600000 && reminderDiff < 600000;
      if (!isDoseTime && !isReminderTime) continue;

      const streak = calcStreakForMed(allLogs.filter((l: any) => l.user_id === med.user_id), med.start_date, tz);
      const dayNum = Math.max(1, Math.floor((now.getTime() - new Date(med.start_date).getTime()) / 86400000) + 1);
      const day = `Day ${dayNum}/${med.course_duration_days}`;
      const doseInfo = `${med.dosage_amount} ${med.dosage_unit}`;

      let title: string, body: string, tag: string;
      if (isReminderTime) {
        title = `Reminder: ${med.name}`;
        body = `${doseInfo} · ${day}${streak > 0 ? `\nStreak: ${streak} days` : ""}`;
        tag = `mt-rem-${med.id}-${nextMs}`;
      } else {
        title = `${med.name}`;
        body = `Take ${doseInfo}${med.notes ? `\n\n${med.notes}` : ""}\n${day}${streak > 0 ? `\n${streak} day streak` : ""}`;
        tag = `mt-dose-${med.id}-${nextMs}`;
      }
      if (!(await claimTag(supabase, tag))) continue;

      const payload = JSON.stringify({ title, body, tag });
      const userSubs = subMap.get(med.user_id) || [];

      for (const sub of userSubs) {
        const r = await sendPush(sub, payload);
        results.push(r);
        if (r.ok) sent++;
        else if (r.statusCode === 404 || r.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }

    // Evening check-in reminder (7-9 PM local)
    for (const userId of userIds) {
      const tz = tzFor(userId);
      const todayStr = getLocalTodayStr(tz);
      const localHour = getLocalHour(tz);
      if (localHour < 19 || localHour > 21) continue;
      const lastCheckin = profileCheckinDate.get(userId);
      if (lastCheckin === todayStr) continue;
      const userSubs = subMap.get(userId);
      if (!userSubs?.length) continue;
      const userMeds = meds.filter((m: any) => m.user_id === userId);
      const streak = userMeds.length ? calcStreakForMed(allLogs.filter((l: any) => l.user_id === userId), userMeds[0].start_date, tz) : 0;
      const tag = `mt-checkin-${userId}-${todayStr}`;
      if (!(await claimTag(supabase, tag))) continue;
      const payload = JSON.stringify({
        title: "How was your day?",
        body: `Take a moment to log how you're feeling today.${streak > 0 ? `\nCurrent streak: ${streak} days` : ""}\nTap to check in.`,
        tag,
      });
      for (const sub of userSubs) {
        const r = await sendPush(sub, payload);
        results.push(r);
        if (r.ok) sent++;
        else if (r.statusCode === 404 || r.statusCode === 410) await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
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
      const tag = `mt-daily-${userId}-${todayStr}`;
      if (!(await claimTag(supabase, tag))) continue;
      const payload = JSON.stringify({ title: msg.title, body: `${msg.body}\nCurrent streak: ${streak} days`, tag });

      for (const sub of userSubs) {
        const r = await sendPush(sub, payload);
        results.push(r);
        if (r.ok) sent++;
        else if (r.statusCode === 404 || r.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }

    // Caregiver missed-dose alerts (Family tier)
    const { data: familyLinks } = await supabase
      .from("family_members")
      .select("id, owner_id, member_user_id, member_name, member_email")
      .eq("status", "active")
      .not("member_user_id", "is", null);

    if (familyLinks?.length) {
      const ownerIds = [...new Set(familyLinks.map((l: any) => l.owner_id))];
      const ownerPlansRes = await supabase
        .from("profiles")
        .select("id, plan")
        .in("id", ownerIds);
      const ownerPlanMap = new Map<string, string>((ownerPlansRes.data || []).map((p: any) => [p.id, p.plan]));
      const ownerSubsRes = await supabase
        .from("push_subscriptions")
        .select("user_id, endpoint, p256dh, auth")
        .in("user_id", ownerIds);
      const ownerSubMap = new Map<string, any[]>();
      (ownerSubsRes.data || []).forEach((s: any) => {
        if (!ownerSubMap.has(s.user_id)) ownerSubMap.set(s.user_id, []);
        ownerSubMap.get(s.user_id)!.push({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth });
      });

      for (const link of familyLinks) {
        if (ownerPlanMap.get(link.owner_id) !== "family") continue;
        const memberMeds = meds.filter((m: any) => m.user_id === link.member_user_id);
        if (!memberMeds.length) continue;
        const ownerSubs = ownerSubMap.get(link.owner_id) || [];
        if (!ownerSubs.length) continue;

        const tz = tzFor(link.member_user_id);
        const memberProf = profiles.find((p: any) => p.id === link.member_user_id);
        const todayStr = getLocalTodayStr(tz);

        const missed: { name: string; time: string }[] = [];
        for (const med of memberMeds) {
          const end = new Date(med.start_date);
          end.setDate(end.getDate() + med.course_duration_days);
          if (end < now || new Date(med.start_date) > now) continue;

          const medLogs = allLogs.filter((l: any) =>
            l.user_id === med.user_id && l.medication_id === med.id);
          const lastLog = medLogs.sort((a: any, b: any) => b.taken_at.localeCompare(a.taken_at))[0];
          if (!lastLog) continue;

          const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
          const nextMs = new Date(lastLog.taken_at).getTime() + intervalMs;
          if (nowMs - nextMs <= 30 * 60000) continue;

          let time = "";
          try {
            time = new Date(nextMs).toLocaleString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
          } catch {}
          missed.push({ name: med.name, time });
        }

        if (!missed.length) continue;

        const memberName = link.member_name || memberProf?.full_name || link.member_email || "your family member";
        const listStr = missed.slice(0, 3).map(m => m.time ? `${m.name} at ${m.time}` : m.name).join(", ");
        const title = `Missed dose: ${memberName}`;
        const body = `${missed.length} dose${missed.length > 1 ? "s" : ""} missed — ${listStr}. Remind them to take it.`;
        const tag = `mt-family-${link.id}-${todayStr}`;
        if (!(await claimTag(supabase, tag))) continue;
        const payload = JSON.stringify({ title, body, tag });

        for (const sub of ownerSubs) {
          const r = await sendPush(sub, payload);
          results.push(r);
          if (r.ok) sent++;
          else if (r.statusCode === 404 || r.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
        }
      }
    }

    try {
      await supabase
        .from("notification_dedup")
        .delete()
        .lt("sent_at", new Date(Date.now() - 7 * 86400000).toISOString());
    } catch {}

    return new Response(JSON.stringify({ ok: true, sent, native: results.filter(r => r.type === "fcm" && r.ok).length, results }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
