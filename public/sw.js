const CACHE = "adhera-v3";
const API_CACHE = "adhera-api-v1";
const ALARM_CACHE = "adhera-alarms-v1";

let doseDB = {};

// ---- Persistent dose-alarm ledger -----------------------------------------
// The old design kept pending setTimeout callbacks only in memory, so any time
// the browser killed this idle service worker every pending reminder was lost
// with no recovery. The schedule now lives in a dedicated Cache entry and is
// re-armed on every `activate`, so a dose that was scheduled is never silently
// forgotten — at worst it fires slightly late after the worker restarts.
// Absolute-path key — the Cache API requires a parseable URL, not a bare label.
const ALARM_KEY = "/__adhera-alarm-schedule";

async function saveSchedule(items) {
  try {
    const cache = await caches.open(ALARM_CACHE);
    await cache.put(ALARM_KEY, new Response(JSON.stringify({ updatedAt: Date.now(), items }), {
      headers: { "Content-Type": "application/json" },
    }));
  } catch (err) {
    console.error("alarm ledger save failed:", err);
  }
}

async function loadSchedule() {
  try {
    const cache = await caches.open(ALARM_CACHE);
    const match = await cache.match(ALARM_KEY);
    if (!match) return [];
    const json = await match.json();
    return Array.isArray(json.items) ? json.items : [];
  } catch (err) {
    console.error("alarm ledger load failed:", err);
    return [];
  }
}

async function clearSchedule() {
  try {
    const cache = await caches.open(ALARM_CACHE);
    await cache.delete(ALARM_KEY);
  } catch (err) {
    console.error("alarm ledger clear failed:", err);
  }
}

function fireDose(item) {
  const daysSince = Math.max(1, Math.floor((Date.now() - new Date(item.startDate).getTime()) / 86400000) + 1);
  self.registration.showNotification(`${item.name}`, {
    body: `Take ${item.dosageAmount} ${item.dosageUnit}${item.notes ? `\n\n${item.notes}` : ""}\nDay ${daysSince}/${item.courseDays}${item.streak > 0 ? `\n${item.streak} day streak` : ""}`,
    icon: "/icon.svg",
    tag: `mt-dose-${item.medId}-${item.doseAt}`,
    vibrate: [500, 200, 500, 200, 500],
    requireInteraction: true,
  });
}

function fireLead(item) {
  const daysSince = Math.max(1, Math.floor((Date.now() - new Date(item.startDate).getTime()) / 86400000) + 1);
  self.registration.showNotification(`⏰ Reminder: ${item.name}`, {
    body: `${item.dosageAmount} ${item.dosageUnit} · Day ${daysSince}/${item.courseDays}`,
    icon: "/icon.svg",
    tag: `mt-rem-${item.medId}-${item.doseAt}`,
    vibrate: [300, 150, 300],
    requireInteraction: true,
  });
}

// Drop every in-memory timer, then arm fresh timers for any item whose dose
// time is still in the future and persist the surviving schedule.
async function armSchedule(items) {
  Object.keys(doseDB).forEach(k => { if (doseDB[k]?.timer) clearTimeout(doseDB[k].timer); });
  doseDB = {};
  const nowTs = Date.now();
  const active = (items || []).filter(item => item.doseAt && item.doseAt - nowTs > 0);
  active.forEach(item => {
    const timerId = `mt-${item.medId}-${item.doseAt}`;
    const delay = item.doseAt - nowTs;
    const alertAtDose = item.alertAtDose !== false;
    if (alertAtDose) {
      doseDB[timerId] = { timer: setTimeout(() => fireDose(item), delay), item };
    }
    const leadDelay = delay - (item.lead || 0) * 60000;
    if (item.lead > 0 && leadDelay > 0) {
      doseDB[`${timerId}-lead`] = { timer: setTimeout(() => fireLead(item), leadDelay), item };
    }
  });
  await saveSchedule(active);
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", e => e.waitUntil(
  Promise.all([
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE && k !== API_CACHE && k !== ALARM_CACHE).map(k => caches.delete(k))
    )),
    // Re-arm anything that was scheduled before the worker was last killed.
    loadSchedule().then(schedule => armSchedule(schedule)),
  ]).then(() => clients.claim())
));

function deepLinkFromTag(tag) {
  const t = String(tag || "");
  if (t.startsWith("mt-dose-") || t.startsWith("mt-rem-")) {
    const m = t.match(/^mt-(?:dose|rem)-(.+)-(\d+)$/);
    if (m) return { type: "mt-open-alarm", data: { medId: m[1], doseAt: m[2] }, isReminder: t.startsWith("mt-rem-") };
    return null;
  }
  if (t.startsWith("mt-visit-now-")) {
    const visitId = t.slice("mt-visit-now-".length, t.lastIndexOf("-"));
    if (visitId) return { type: "mt-open-visit", data: { visitId } };
    return null;
  }
  if (t.startsWith("mt-visit-")) {
    const visitId = t.slice("mt-visit-".length, t.lastIndexOf("-"));
    if (visitId) return { type: "mt-open-visit", data: { visitId } };
    return null;
  }
  if (t.startsWith("mt-vital-")) return { type: "mt-open-vitals" };
  if (t.startsWith("mt-checkin-")) return { type: "mt-open-checkin" };
  return null;
}

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const dl = deepLinkFromTag(e.notification.tag);
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(cls => {
      if (dl?.type === "mt-open-alarm") {
        const msg = { type: "mt-open-alarm", medId: dl.data.medId, doseAt: dl.data.doseAt, isReminder: !!dl.isReminder };
        cls.forEach(c => c.postMessage?.(msg));
        if (cls.length > 0) { cls[0].focus(); return; }
        clients.openWindow(`/?mt=alarm&medId=${encodeURIComponent(dl.data.medId)}&doseAt=${encodeURIComponent(dl.data.doseAt)}&isReminder=${dl.isReminder ? "1" : ""}`);
        return;
      }
      if (dl) {
        cls.forEach(c => c.postMessage?.({ type: dl.type, ...(dl.data || {}) }));
      } else {
        cls.forEach(c => c.postMessage?.({ type: "alarm-ack" }));
      }
      if (cls.length > 0) { cls[0].focus(); return; }
      if (dl?.type === "mt-open-visit") {
        clients.openWindow(`/?mt=visit&visitId=${encodeURIComponent(dl.data.visitId)}`);
      } else if (dl?.type === "mt-open-vitals") {
        clients.openWindow("/?mt=vitals");
      } else if (dl?.type === "mt-open-checkin") {
        clients.openWindow("/?mt=checkin");
      } else {
        clients.openWindow("/");
      }
    })
  );
});

self.addEventListener("message", e => {
  const { type, payload } = e.data || {};
  if (type === "schedule-doses" && Array.isArray(payload)) {
    e.waitUntil(armSchedule(payload));
  }
  if (type === "clear-alarms") {
    Object.keys(doseDB).forEach(k => { if (doseDB[k]?.timer) clearTimeout(doseDB[k].timer); });
    doseDB = {};
    e.waitUntil(clearSchedule());
  }
});

self.addEventListener("push", e => {
  const d = e.data?.json() || {};
  self.registration.showNotification(d.title || "Adhera", {
    body: d.body || "Time to take your medication",
    icon: "/icon.svg",
    vibrate: [500, 200, 500, 200, 500],
    tag: d.tag || "mt-push",
    requireInteraction: true,
  });
});

self.addEventListener("fetch", e => {
  const { request } = e;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cache API responses for offline use (stale-while-revalidate)
  if (url.pathname.startsWith("/api/") || url.hostname.endsWith(".supabase.co")) {
    e.respondWith(
      caches.open(API_CACHE).then(cache =>
        fetch(request).then(res => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => cache.match(request) || new Response(null, { status: 503 }))
      )
    );
    return;
  }

  // Navigation requests: network-first with cache fallback
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(request, clone));
        return r;
      }).catch(() => caches.match(request).then(cached => {
        if (cached) return cached;
        return caches.match("/");
      }))
    );
    return;
  }

  // Static assets: cache-first
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(r => {
        if (r.ok && url.origin === self.location.origin) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return r;
      });
    })
  );
});
