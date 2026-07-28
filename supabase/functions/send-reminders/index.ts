import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = "mailto:support@adhera.app";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function calcStreakForMed(medLogs: any[], startDate: string): number {
  const sorted = medLogs
    .filter(l => new Date(l.taken_at) >= new Date(startDate))
    .sort((a: any, b: any) => b.taken_at.localeCompare(a.taken_at));

  let count = 0;
  const d = new Date();
  d.setHours(23, 59, 59, 0);

  while (d >= new Date(startDate)) {
    const dayStr = d.toISOString().split("T")[0];
    const took = sorted.some((l: any) => l.taken_at.startsWith(dayStr));
    if (took) { count++; d.setDate(d.getDate() - 1); }
    else if (count === 0) { d.setDate(d.getDate() - 1); continue; }
    else break;
  }
  return count;
}

serve(async (_req) => {
  try {
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
      supabase.from("profiles").select("id, wake_time, reminder_lead").in("id", userIds),
      supabase.from("dose_logs").select("medication_id, taken_at, user_id").in("user_id", userIds).gte("taken_at", new Date(Date.now() - 86400000 * 2).toISOString()),
      supabase.from("push_subscriptions").select("user_id, endpoint, p256dh, auth").in("user_id", userIds),
    ]);

    const profiles = profilesRes.data || [];
    const allLogs = logsRes.data || [];
    const subs = subsRes.data || [];

    if (!subs.length) {
      return new Response(JSON.stringify({ ok: true, msg: "No subscriptions", sent: 0 }), { status: 200 });
    }

    const subMap = new Map<string, any[]>();
    subs.forEach((s: any) => {
      if (!subMap.has(s.user_id)) subMap.set(s.user_id, []);
      subMap.get(s.user_id)!.push({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } });
    });

    let sent = 0;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    for (const med of meds) {
      const prof = profiles.find(p => p.id === med.user_id);
      const wakeTime = prof?.wake_time || "08:00";
      const leadMin = prof?.reminder_lead ?? 30;
      const medLogs = allLogs.filter((l: any) => l.user_id === med.user_id && l.medication_id === med.id);

      const end = new Date(med.start_date);
      end.setDate(end.getDate() + med.course_duration_days);
      if (end < now) continue;

      const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
      const todayStart = new Date(`${todayStr}T${wakeTime}:00`);
      const lastLog = medLogs.sort((a: any, b: any) => b.taken_at.localeCompare(a.taken_at))[0];

      let doseTimes: Date[] = [];
      if (lastLog && new Date(lastLog.taken_at) >= todayStart) {
        const next = new Date(new Date(lastLog.taken_at).getTime() + intervalMs);
        if (next > now) doseTimes.push(next);
      } else {
        const dosesToday = med.times_per_day || 1;
        for (let i = 0; i < dosesToday; i++) {
          doseTimes.push(new Date(todayStart.getTime() + i * intervalMs));
        }
      }

      const todayCount = medLogs.filter((l: any) => l.taken_at?.startsWith(todayStr)).length;
      if (todayCount >= (med.times_per_day || 1)) continue;

      const streak = calcStreakForMed(allLogs.filter((l: any) => l.user_id === med.user_id), med.start_date);
      const dayNum = Math.max(1, Math.floor((now.getTime() - new Date(med.start_date).getTime()) / 86400000) + 1);
      const day = `Day ${dayNum}/${med.course_duration_days}`;
      const doseInfo = `${med.dosage_amount} ${med.dosage_unit}`;

      for (const doseAt of doseTimes) {
        const diff = doseAt.getTime() - now.getTime();
        const reminderDiff = diff - leadMin * 60000;

        const isDoseTime = diff > -600000 && diff < 600000;
        const isReminderTime = leadMin > 0 && reminderDiff > -600000 && reminderDiff < 600000;

        if (!isDoseTime && !isReminderTime) continue;

        let title: string, body: string, tag: string;
        if (isReminderTime) {
          title = `⏰ Reminder: ${med.name}`;
          body = `${doseInfo} · ${day}${streak > 0 ? `\n🔥 Streak: ${streak} days` : ""}`;
          tag = `mt-rem-${med.id}-${doseAt.getTime()}`;
        } else {
          title = `💊 ${med.name}`;
          body = `Take ${doseInfo}${med.notes ? `\n\n${med.notes}` : ""}\n${day}${streak > 0 ? `\n🔥 ${streak} day streak` : ""}`;
          tag = `mt-dose-${med.id}-${doseAt.getTime()}`;
        }

        const payload = JSON.stringify({ title, body, tag });
        const userSubs = subMap.get(med.user_id) || [];

        for (const sub of userSubs) {
          try {
            await webpush.sendNotification(sub, payload, { TTL: 86400 });
            sent++;
          } catch (e: any) {
            if (e.statusCode === 404 || e.statusCode === 410) {
              await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
