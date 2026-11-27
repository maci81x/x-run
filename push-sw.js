/* X-Run · web push (Blocco B, 27/11). Loaded by the workbox service worker (importScripts in
 * workbox-config.cjs). Shows the notification written in the app and, on tap, opens the same
 * page inside the app (only in-app routes, same rule as notifications.link). */
/* eslint-disable no-restricted-globals */
const SAFE_LINK = /^\/[A-Za-z0-9/_?=&.-]{0,200}$/;

function appUrl(link) {
  const path =
    typeof link === 'string' && SAFE_LINK.test(link) && !link.startsWith('//')
      ? link
      : '/crew/notifiche';
  // The scope ends with "/" (e.g. https://maci81x.github.io/x-run/).
  return new URL(path.slice(1), self.registration.scope).href;
}

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }
  const title = typeof data.title === 'string' && data.title ? data.title : 'X-Run Crew';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === 'string' ? data.body : '',
      tag: typeof data.tag === 'string' ? data.tag : undefined,
      renotify: typeof data.tag === 'string',
      data: { link: data.link },
      icon: new URL('icons/icon-192.png', self.registration.scope).href,
      badge: new URL('icons/icon-192.png', self.registration.scope).href,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = appUrl(event.notification.data && event.notification.data.link);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const client = list.find((c) => c.url.startsWith(self.registration.scope) && 'focus' in c);
      if (!client) return self.clients.openWindow(url);
      // navigate() rejects on a tab this worker does not control (just updated, hard
      // reload): then a new window opens on the right page.
      return client
        .focus()
        .then((c) =>
          c && 'navigate' in c ? c.navigate(url) : Promise.reject(new Error('no navigate')),
        )
        .catch(() => self.clients.openWindow(url));
    }),
  );
});
