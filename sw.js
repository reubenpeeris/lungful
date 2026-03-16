const CACHE = 'lungful-1.0.2';
const PRECACHE = [
  '/lungful/',
  '/lungful/index.html',
  '/lungful/manifest.json',
  '/lungful/icons/icon-192.png',
  '/lungful/icons/icon-512.png',
  '/lungful/samples/cello-c2.flac',
  '/lungful/samples/cello-piz-rr1-c2.flac',
  '/lungful/samples/cello-piz-rr1-g2.flac',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Remove old caches
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
