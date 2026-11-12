const CACHE = 'hamly-v8';
const FILES = ['./', './index.html', './i18n-en.js', './weeks-dev.js', './weeks-more.js', './weeks-more-en.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './badge.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Network first (so updates show up right away), cache as offline fallback.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const sameOrigin = new URL(e.request.url).origin === location.origin;
  e.respondWith(
    // Same-origin app files: always ask the server for the newest version (skip the browser's HTTP cache)
    (sameOrigin && e.request.mode !== 'navigate' ? fetch(e.request.url, {cache: 'no-cache'}) : fetch(e.request, {cache: 'no-cache'})).then(res => {
      if (res.ok && sameOrigin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(list => {
    if (list.length) return list[0].focus();
    return self.clients.openWindow('./index.html');
  }));
});
