self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const payload = event.data
    ? event.data.json()
    : { title: "AP505", body: "Tem novidade nos gastos.", url: "/dashboard" };

  event.waitUntil(
    self.registration.showNotification(payload.title || "AP505", {
      body: payload.body || "Tem novidade nos gastos.",
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      data: { url: payload.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => client.url.includes(self.location.origin));
      if (existingClient) {
        existingClient.focus();
        return existingClient.navigate(url);
      }
      return self.clients.openWindow(url);
    }),
  );
});
