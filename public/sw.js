const CACHE_NAME = 'crazyhunter-cache-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/script.js',
  '/src/index.css',
  '/src/games.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // CRITICAL: NEVER intercept POST requests or anything in /api/
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return; // Let the browser handle it normally
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
