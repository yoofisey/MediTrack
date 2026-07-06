export async function askNotifPerm() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function scheduleNotifs(meds, leadMin, wakeTime) {
  if (window._mt_timers) window._mt_timers.forEach(clearTimeout);
  window._mt_timers = [];
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  meds.forEach(med => {
    if (!med.active) return;
    const end = new Date(med.start_date); end.setDate(end.getDate() + med.course_duration_days);
    if (end < now) return;
    const tpd = med.times_per_day || 1;
    const ivMs = (24 / tpd) * 3600000;
    const base = new Date(`${todayStr}T${wakeTime || "08:00"}:00`);
    const lead = med.reminder_minutes != null ? med.reminder_minutes : leadMin;
    for (let i = 0; i < tpd; i++) {
      const doseAt = new Date(base.getTime() + i * ivMs);
      const notifAt = new Date(doseAt.getTime() - lead * 60000);
      const delay = notifAt - now;
      if (delay < 0) continue;
      const tag = `mt-${med.id}-${i}`;
      window._mt_timers.push(setTimeout(() => {
        if (!("Notification" in window)) return;
        try {
          if (navigator.serviceWorker?.ready) {
            navigator.serviceWorker.ready.then(r => {
              r.showNotification("💊 MediTrack", {
                body: `${lead > 0 ? `In ${lead} min: ` : ""}Take ${med.dosage_amount} ${med.dosage_unit} of ${med.name}`,
                icon: "/icon-192.png", tag, vibrate: [200,100,200],
              });
            }).catch(() => {
              new Notification("💊 MediTrack", { body: `${lead > 0 ? `In ${lead} min: ` : ""}Take ${med.dosage_amount} ${med.dosage_unit} of ${med.name}`, icon: "/favicon.ico", tag });
            });
          } else {
            new Notification("💊 MediTrack", { body: `${lead > 0 ? `In ${lead} min: ` : ""}Take ${med.dosage_amount} ${med.dosage_unit} of ${med.name}`, icon: "/favicon.ico", tag });
          }
        } catch {
          new Notification("💊 MediTrack", { body: `${lead > 0 ? `In ${lead} min: ` : ""}Take ${med.dosage_amount} ${med.dosage_unit} of ${med.name}`, icon: "/favicon.ico", tag });
        }
      }, delay));
    }
  });
}
