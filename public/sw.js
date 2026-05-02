// Fantasix Service Worker — Web Push handler
// Version bump forces re-registration on next visit
const SW_VERSION = "1.0.0"

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()))

self.addEventListener("push", (e) => {
  if (!e.data) return

  let payload
  try {
    payload = e.data.json()
  } catch {
    payload = { title: "Fantasix", body: e.data.text() }
  }

  const { title = "Fantasix", body = "", icon, badge, tag, url } = payload

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon ?? "/api/icon?size=192",
      badge: badge ?? "/api/icon?size=96",
      tag: tag ?? "fantasix-default",
      renotify: true,
      data: { url: url ?? "/" },
      // Vibration pattern: short-long-short (tactical feel)
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener("notificationclick", (e) => {
  e.notification.close()
  const targetUrl = e.notification.data?.url ?? "/"

  e.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus existing tab if already open
        const existing = clients.find((c) => c.url.includes(self.location.origin))
        if (existing) {
          existing.focus()
          existing.navigate(targetUrl).catch(() => self.clients.openWindow(targetUrl))
        } else {
          self.clients.openWindow(targetUrl)
        }
      })
  )
})
