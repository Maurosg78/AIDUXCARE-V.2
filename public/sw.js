// Service Worker - AiDuxCare
// Do NOT cache index.html so deploys always serve the latest bundle (hash-named JS).

const CACHE_NAME = 'aiduxcare-v3';

// Install: skip caching index.html so we always get fresh HTML and correct JS chunk
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: remove all old caches (v1 and any stale data)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: never serve index.html from cache - always network so deploy updates apply
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isDocument = event.request.mode === 'navigate' || event.request.destination === 'document';
  const isIndexHtml = url.pathname === '/' || url.pathname === '/index.html';

  if (isDocument || isIndexHtml) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      if (event.request.destination === 'document') {
        return caches.match('/index.html');
      }
      return undefined;
    })
  );
});
