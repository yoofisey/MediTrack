let CapacitorLocalNotifications = null;

async function getPlugin() {
  if (CapacitorLocalNotifications) return CapacitorLocalNotifications;
  try {
    const mod = await import('@capacitor/local-notifications');
    CapacitorLocalNotifications = mod.LocalNotifications;
    return CapacitorLocalNotifications;
  } catch {
    return null;
  }
}

export function isCapacitor() {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
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

export async function initCapacitorNotifs() {
  const plugin = await getPlugin();
  if (!plugin) return;
  try {
    await plugin.registerActionTypes({
      types: [{
        id: 'DOSE_ACTION',
        actions: [
          { id: 'log', title: '✓ Log dose' },
          { id: 'snooze', title: 'Snooze 5 min' },
        ],
      }],
    });
  } catch {}
}

export async function scheduleDoseNotifications(meds, logs, wakeTime, leadMin, streak) {
  const plugin = await getPlugin();
  if (!plugin) return;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const allNotifications = [];

  for (const med of meds) {
    if (!med.active) continue;
    const end = new Date(med.start_date);
    end.setDate(end.getDate() + med.course_duration_days);
    if (end < now) continue;

    const lead = med.reminder_minutes != null ? med.reminder_minutes : leadMin;
    const logsToday = logs.filter(l => l.medication_id === med.id && l.taken_at?.startsWith(todayStr));
    const lastLog = logs.filter(l => l.medication_id === med.id).sort((a, b) => b.taken_at.localeCompare(a.taken_at))[0];

    let doseTimes = [];

    if (med.reminder_times && med.reminder_times.trim()) {
      doseTimes = med.reminder_times.split(",").map(t => {
        const [h, m] = t.trim().split(":");
        return new Date(`${todayStr}T${(h||"08").padStart(2,"0")}:${(m||"00").padStart(2,"0")}:00`);
      });
      if (lastLog && new Date(lastLog.taken_at) >= new Date(`${todayStr}T00:00:00`)) {
        doseTimes = doseTimes.filter(dt => dt > new Date(lastLog.taken_at));
      }
    } else {
      const intervalMs = (med.dose_interval_hours || 24 / (med.times_per_day || 1)) * 3600000;
      const todayStart = new Date(`${todayStr}T${wakeTime || "08:00"}:00`);
      if (lastLog && new Date(lastLog.taken_at) >= todayStart) {
        const next = new Date(new Date(lastLog.taken_at).getTime() + intervalMs);
        if (next > now) doseTimes.push(next);
      } else {
        const dosesToday = med.times_per_day || 1;
        for (let i = 0; i < dosesToday; i++) doseTimes.push(new Date(todayStart.getTime() + i * intervalMs));
      }
    }

    const expectedToday = med.reminder_times ? doseTimes.length : (med.times_per_day || 1);

    for (const doseAt of doseTimes) {
      const doseMs = doseAt.getTime();
      if (doseMs > new Date(now.getTime() + 86400000).getTime()) continue;

      const alreadyLogged = logsToday.some(l => Math.abs(new Date(l.taken_at).getTime() - doseMs) < 3600000);
      if (alreadyLogged) continue;

      const doseInfo = `${med.dosage_amount} ${med.dosage_unit}`;
      const day = dayLabel(med);

      // Reminder notification
      if (lead > 0) {
        const reminderAt = new Date(doseMs - lead * 60000);
        if (reminderAt > now) {
          allNotifications.push({
            id: notifId(med.id, doseMs, 'reminder'),
            title: `⏰ Reminder: ${med.name}`,
            body: `${doseInfo} · ${day}${med.notes ? `\n${med.notes}` : ""}${streak > 0 ? `\n🔥 Streak: ${streak} days` : ""}`,
            schedule: { at: reminderAt.getTime(), allowWhileIdle: true },
            sound: 'beep.wav',
            ongoing: true,
            autoCancel: false,
            extra: { medId: med.id, doseTimeMs: doseMs, type: 'reminder' },
            actionTypeId: 'DOSE_ACTION',
          });
        }
      }

      // Dose notification
      if (doseMs > now.getTime()) {
        allNotifications.push({
          id: notifId(med.id, doseMs, 'dose'),
          title: `💊 ${med.name}`,
          body: `Take ${doseInfo}${med.notes ? `\n${med.notes}` : ""}\n${day}${streak > 0 ? `\n🔥 ${streak} day streak` : ""}`,
          schedule: { at: doseMs, allowWhileIdle: true },
          sound: 'beep.wav',
          ongoing: true,
          autoCancel: false,
          extra: { medId: med.id, doseTimeMs: doseMs, type: 'dose' },
          actionTypeId: 'DOSE_ACTION',
        });
      }
    }
  }

  if (allNotifications.length) {
    await plugin.cancel({ notifications: allNotifications.map(n => ({ id: n.id })) });
    await plugin.schedule({ notifications: allNotifications });
  }
}

export async function cancelDoseNotifications(medId, doseTimeMs) {
  const plugin = await getPlugin();
  if (!plugin) return;
  const ids = [
    notifId(medId, doseTimeMs, 'dose'),
    notifId(medId, doseTimeMs, 'reminder'),
  ].filter(id => id > 0);
  if (ids.length) {
    await plugin.cancel({ notifications: ids.map(id => ({ id })) });
  }
}

export async function cancelAllScheduled() {
  const plugin = await getPlugin();
  if (!plugin) return;
  try {
    const pending = await plugin.getPending();
    if (pending?.notifications?.length) {
      await plugin.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    }
  } catch {}
}
