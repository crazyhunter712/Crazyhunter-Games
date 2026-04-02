const CACHE_NAME = 'crazyhunter-cache-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/index.css',
  '/src/games.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
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
