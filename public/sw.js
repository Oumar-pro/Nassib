const CACHE_NAME = 'nassib-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch((err) => console.warn('SW cache warning:', err))));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : undefined))));
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { body: event.data?.text() || '' }; }
  const title = payload.title || 'NASSIB';
  const body = payload.body || 'Une nouvelle possibilité vous attend sur NASSIB.';
  const url = payload.url || '/';
  const tag = payload.tag || 'nassib-notification';
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/pwa-192x192.png',
    badge: '/favicon-32x32.png',
    tag,
    renotify: false,
    data: { url },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(targetUrl);
        return;
      }
    }
    await self.clients.openWindow(targetUrl);
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html') || caches.match('/')));
    return;
  }
  if (['.png', '.svg', '.jpg', '.woff2', '.json'].some((suffix) => url.pathname.endsWith(suffix))) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((networkRes) => {
      if (networkRes?.status === 200) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkRes.clone()));
      return networkRes;
    }).catch(() => cached)));
  }
});
