const CACHE = "adhera-v2";
const API_CACHE = "adhera-api-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE && k !== API_CACHE).map(k => caches.delete(k))
  )).then(() => clients.claim())
));

const doseDB = {};

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(cls => {
      cls.forEach(c => c.postMessage?.({ type: "alarm-ack" }));
      if (cls.length > 0) { cls[0].focus(); return; }
      clients.openWindow("/");
    })
  );
});

self.addEventListener("message", e => {
  const { type, payload } = e.data || {};
  if (type === "schedule-doses" && Array.isArray(payload)) {
    Object.keys(doseDB).forEach(k => { if (doseDB[k]?.timer) clearTimeout(doseDB[k].timer); });
    payload.forEach(item => {
      const timerId = `mt-${item.medId}-${item.doseAt}`;
      const delay = item.doseAt - Date.now();
      if (delay <= 0) return;
      doseDB[timerId] = {
        timer: setTimeout(() => {
          const daysSince = Math.max(1, Math.floor((Date.now() - new Date(item.startDate).getTime()) / 86400000) + 1);
          self.registration.showNotification(`💊 ${item.name}`, {
            body: `Take ${item.dosageAmount} ${item.dosageUnit}${item.notes ? `\n\n${item.notes}` : ""}\nDay ${daysSince}/${item.courseDays}${item.streak > 0 ? `\n🔥 ${item.streak} day streak` : ""}`,
            icon: "/icon.svg",
            tag: `mt-dose-${item.medId}-${item.doseAt}`,
            vibrate: [500, 200, 500, 200, 500],
            requireInteraction: true,
          });
          delete doseDB[timerId];
        }, delay),
        item,
      };
      const leadTimerId = `${timerId}-lead`;
      const leadDelay = delay - item.lead * 60000;
      if (item.lead > 0 && leadDelay > 0) {
        doseDB[leadTimerId] = {
          timer: setTimeout(() => {
            const daysSince = Math.max(1, Math.floor((Date.now() - new Date(item.startDate).getTime()) / 86400000) + 1);
            self.registration.showNotification(`⏰ Reminder: ${item.name}`, {
              body: `${item.dosageAmount} ${item.dosageUnit} · Day ${daysSince}/${item.courseDays}`,
              icon: "/icon.svg",
              tag: `mt-rem-${item.medId}-${item.doseAt}`,
              vibrate: [300, 150, 300],
              requireInteraction: true,
            });
            delete doseDB[leadTimerId];
          }, leadDelay),
          item,
        };
      }
    });
  }
  if (type === "clear-alarms") {
    Object.keys(doseDB).forEach(k => { if (doseDB[k]?.timer) clearTimeout(doseDB[k].timer); });
    Object.keys(doseDB).forEach(k => delete doseDB[k]);
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
