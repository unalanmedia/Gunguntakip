const CACHE = "kuran-takip-v3";
const ASSETS = ["./", "./index.html", "./manifest.json", "./sw.js"];

let reminderTimer = null;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "CANCEL") {
    if (reminderTimer) clearTimeout(reminderTimer);
    reminderTimer = null;
    return;
  }

  if (data.type === "SCHEDULE") {
    const minutes = Number(data.minutes || 1);
    if (reminderTimer) clearTimeout(reminderTimer);

    reminderTimer = setTimeout(async () => {
      try {
        await self.registration.showNotification("Kur’an okuma hatırlatıcısı", {
          body: "Bugün okumanı işaretlemeyi unutma 🙂",
          tag: "kuran-reminder",
          renotify: true
        });
      } catch (e) {}
    }, minutes * 60 * 1000);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of allClients) {
      if ("focus" in c) return c.focus();
    }
    if (clients.openWindow) return clients.openWindow("./index.html");
  })());
});
