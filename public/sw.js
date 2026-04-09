// public/sw.js
const CACHE_NAME = 'tour-assets-v2';

// Essential assets to cache immediately on install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js', // Adjust if build names differ
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME && caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy: Cache First for all project assets
  if (request.method === 'GET' && url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        });
      })
    );
    return;
  }

  // Default strategy for other requests: Network First (with Cache fallback)
  // This ensures that structural updates (HTML, logic JS) are downloaded on refresh
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

// Handle messages from the main thread (Preloader)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PRELOAD_ASSETS') {
    const urls = event.data.payload;
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return Promise.all(urls.map(url => {
          return cache.match(url).then(response => {
            if (!response) {
              return cache.add(url).catch(err => console.warn(`SW: Failed to preload ${url}`, err));
            }
          });
        }));
      })
    );
  }
});