self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(clients.claim()));
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(cls => {
      if (cls.length > 0) { cls[0].focus(); return; }
      clients.openWindow("/");
    })
  );
});
self.addEventListener("push", e => {
  const d = e.data?.json() || {};
  self.registration.showNotification(d.title || "MediTrack", {
    body: d.body || "Time to take your medication",
    vibrate: [200, 100, 200],
    tag: d.tag || "mt-push",
  });
});
